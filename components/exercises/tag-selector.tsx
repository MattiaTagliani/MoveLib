"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useMemo, useState } from "react";

export interface ExerciseTag {
  id: string;
  name: string;
}

interface TagSelectorProps {
  initialTags: ExerciseTag[];
  selectedTagIds: string[];
  onSelectedTagIdsChange: (tagIds: string[]) => void;
}

export function TagSelector({
  initialTags,
  selectedTagIds,
  onSelectedTagIdsChange,
}: TagSelectorProps) {
  const [tags, setTags] = useState(initialTags);
  const [tagSearch, setTagSearch] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visibleTags = useMemo(() => {
    const normalizedSearch = tagSearch.trim().toLocaleLowerCase("it");

    if (!normalizedSearch) {
      return tags;
    }

    return tags.filter(
      (tag) =>
        selectedTagIds.includes(tag.id) ||
        tag.name.toLocaleLowerCase("it").includes(normalizedSearch),
    );
  }, [tags, tagSearch, selectedTagIds]);

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(
        selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId),
      );
      return;
    }

    onSelectedTagIdsChange([...selectedTagIds, tagId]);
  }

  async function createTag() {
    const trimmedName = newTagName.trim();

    if (!trimmedName) {
      return;
    }

    setError(null);

    const supabase = createClient();

    const { data: newTag, error: insertError } = await supabase
      .from("tags")
      .insert({
        name: trimmedName,
      })
      .select("id, name")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Questo tag esiste già.");
      } else {
        setError(insertError.message);
      }

      return;
    }

    setTags((currentTags) =>
      [...currentTags, newTag].sort((a, b) =>
        a.name.localeCompare(b.name, "it"),
      ),
    );

    onSelectedTagIdsChange([...selectedTagIds, newTag.id]);

    setNewTagName("");
    setTagSearch("");
    setIsAddingTag(false);
  }

  return (
    <div className="space-y-3">
      {tags.length > 0 && (
        <>
          <Input
            value={tagSearch}
            onChange={(event) => setTagSearch(event.target.value)}
            placeholder="Cerca tag..."
            className="max-w-md"
          />

          {visibleTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);

                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun tag trovato.</p>
          )}
        </>
      )}

      {isAddingTag ? (
        <div className="flex max-w-md gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void createTag();
              }
            }}
            placeholder="Nome del nuovo tag"
          />

          <Button type="button" onClick={createTag}>
            Aggiungi
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setNewTagName("");
              setError(null);
              setIsAddingTag(false);
            }}
          >
            Annulla
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingTag(true)}
        >
          + Nuovo tag
        </Button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
