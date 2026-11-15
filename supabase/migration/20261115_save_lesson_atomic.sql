
create or replace function public.save_lesson_atomic(
  p_lesson_id uuid,
  p_title text,
  p_items jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_exercise jsonb;
  v_item_type text;
  v_item_key text;
  v_block_id uuid;
  v_position integer := 0;
  v_exercise_position integer;
  v_block_ids jsonb := '{}'::jsonb;
  v_retained_ids uuid[] := array[]::uuid[];
begin
  -- Validate the authenticated user and input.
  if auth.uid() is null then
    raise exception 'Utente non autenticato.';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'Inserisci un titolo per la lezione.';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Struttura della lezione non valida.';
  end if;

  -- Lock the lesson while saving.
  perform 1
  from public.lessons
  where id = p_lesson_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Lezione non trovata o accesso negato.';
  end if;

  -- Validate all items before modifying anything.
  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Elemento della lezione non valido.';
    end if;

    v_item_type := v_item->>'type';
    v_item_key := v_item->>'key';

    if v_item_type is null
       or v_item_type not in ('block', 'exercise')
       or nullif(v_item_key, '') is null then
      raise exception 'Tipo o chiave dell''elemento non validi.';
    end if;

    if v_item_type = 'block' then
      if jsonb_typeof(v_item->'block') <> 'object'
         or nullif(btrim(v_item->'block'->>'name'), '') is null
         or jsonb_typeof(v_item->'block'->'exercises') <> 'array' then
        raise exception 'Blocco non valido.';
      end if;

      if nullif(v_item->'block'->>'id', '') is not null then
        perform 1
        from public.lesson_blocks
        where id = (v_item->'block'->>'id')::uuid
          and lesson_id = p_lesson_id;

        if not found then
          raise exception 'Un blocco non appartiene alla lezione.';
        end if;
      end if;

      for v_exercise in
        select value
        from jsonb_array_elements(
          v_item->'block'->'exercises'
        )
      loop
        if jsonb_typeof(v_exercise) <> 'object'
           or nullif(v_exercise->>'exerciseId', '') is null then
          raise exception 'Esercizio del blocco non valido.';
        end if;
      end loop;
    else
      if jsonb_typeof(v_item->'exercise') <> 'object'
         or nullif(
           v_item->'exercise'->>'exerciseId', ''
         ) is null then
        raise exception 'Esercizio non valido.';
      end if;
    end if;
  end loop;

  -- Prevent duplicate React keys.
  if (
    select count(*) <> count(distinct value->>'key')
    from jsonb_array_elements(p_items)
  ) then
    raise exception 'Chiavi duplicate nella lezione.';
  end if;

  -- Prevent the same existing block being submitted twice.
  if (
    select count(*) <>
           count(distinct value->'block'->>'id')
    from jsonb_array_elements(p_items)
    where value->>'type' = 'block'
      and nullif(value->'block'->>'id', '') is not null
  ) then
    raise exception 'Blocchi duplicati nella lezione.';
  end if;

  -- Create or update lesson blocks.
  v_position := 0;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    if v_item->>'type' = 'block' then

      if nullif(v_item->'block'->>'id', '') is not null then
        v_block_id := (v_item->'block'->>'id')::uuid;

        update public.lesson_blocks
        set name = btrim(v_item->'block'->>'name'),
            position = v_position
        where id = v_block_id
          and lesson_id = p_lesson_id;

        if not found then
          raise exception 'Blocco non trovato.';
        end if;
      else
        insert into public.lesson_blocks (
          lesson_id,
          name,
          position
        )
        values (
          p_lesson_id,
          btrim(v_item->'block'->>'name'),
          v_position
        )
        returning id into v_block_id;
      end if;

      v_retained_ids := array_append(
        v_retained_ids,
        v_block_id
      );

      v_block_ids := v_block_ids ||
        jsonb_build_object(
          v_item->>'key',
          v_block_id
        );
    end if;

    v_position := v_position + 1;
  end loop;

  -- Replace exercise placements.
  -- Existing block IDs remain unchanged.
  delete from public.lesson_exercises
  where lesson_id = p_lesson_id;

  v_position := 0;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
  loop
    if v_item->>'type' = 'exercise' then

      insert into public.lesson_exercises (
        lesson_id,
        lesson_block_id,
        exercise_id,
        variant_id,
        position,
        lesson_position
      )
      values (
        p_lesson_id,
        null,
        (v_item->'exercise'->>'exerciseId')::uuid,
        nullif(
          v_item->'exercise'->>'variantId', ''
        )::uuid,
        0,
        v_position
      );

    else
      v_block_id := (
        v_block_ids->>(v_item->>'key')
      )::uuid;

      v_exercise_position := 0;

      for v_exercise in
        select value
        from jsonb_array_elements(
          v_item->'block'->'exercises'
        )
      loop
        insert into public.lesson_exercises (
          lesson_id,
          lesson_block_id,
          exercise_id,
          variant_id,
          position,
          lesson_position
        )
        values (
          p_lesson_id,
          v_block_id,
          (v_exercise->>'exerciseId')::uuid,
          nullif(
            v_exercise->>'variantId', ''
          )::uuid,
          v_exercise_position,
          null
        );

        v_exercise_position := v_exercise_position + 1;
      end loop;
    end if;

    v_position := v_position + 1;
  end loop;

  -- Remove blocks no longer present.
  delete from public.lesson_blocks
  where lesson_id = p_lesson_id
    and not (id = any(v_retained_ids));

  -- Update the lesson.
  update public.lessons
  set title = btrim(p_title),
      updated_at = now()
  where id = p_lesson_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Impossibile aggiornare la lezione.';
  end if;

  return v_block_ids;
end;
$$;

-- Only authenticated users may call this function.
revoke all on function public.save_lesson_atomic(
  uuid, text, jsonb
) from public;

revoke all on function public.save_lesson_atomic(
  uuid, text, jsonb
) from anon;

grant execute on function public.save_lesson_atomic(
  uuid, text, jsonb
) to authenticated;
