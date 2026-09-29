import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Check that somebody is logged in.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Devi effettuare l'accesso." },
      { status: 401 },
    );
  }

  // 2. Check that the logged-in user is an admin.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Devi effettuare l'accesso." },
      { status: 403 },
    );
  }

  // 3. Read the registration request ID from the request body.
  const body = await request.json();
  const requestId = body.requestId;

  if (!requestId || typeof requestId !== "string") {
    return NextResponse.json(
      {
        error:
          "È necessario specificare una richiesta di registrazione valida.",
      },
      { status: 400 },
    );
  }

  // 4. Get the registration request.
  const { data: registrationRequest, error: requestError } = await supabase
    .from("registration_requests")
    .select("id, name, email, status")
    .eq("id", requestId)
    .single();

  if (requestError || !registrationRequest) {
    return NextResponse.json(
      { error: "Richiesta di registrazione non trovata." },
      { status: 404 },
    );
  }

  // 5. Only pending requests can be approved.
  if (registrationRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "Questa richiesta di registrazione è già stata elaborata." },
      { status: 400 },
    );
  }

  const email = registrationRequest.email.trim().toLowerCase();

  // 6. Use the admin client for the privileged Auth operation.
  const admin = createAdminClient();

  // 7. Check whether an Auth user with this email already exists.
  const { data: usersData, error: usersError } =
    await admin.auth.admin.listUsers();

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const existingUser = usersData.users.find(
    (authUser) => authUser.email?.toLowerCase() === email,
  );

  if (existingUser) {
    return NextResponse.json(
      { error: "Esiste già un utente con questo indirizzo email." },
      { status: 409 },
    );
  }

  // 8. Invite the user.
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        display_name: registrationRequest.name,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // 9. Mark the registration request as approved.
  const { error: updateError } = await supabase
    .from("registration_requests")
    .update({ status: "APPROVED" })
    .eq("id", requestId)
    .eq("status", "PENDING");

  if (updateError) {
    return NextResponse.json(
      {
        error:
          "L'invito è stato inviato, ma non è stato possibile contrassegnare la richiesta come approvata.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
