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
      { error: "You must be logged in." },
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
      { error: "You are not authorized to approve registrations." },
      { status: 403 },
    );
  }

  // 3. Read the registration request ID from the request body.
  const body = await request.json();
  const requestId = body.requestId;

  if (!requestId || typeof requestId !== "string") {
    return NextResponse.json(
      { error: "A valid registration request ID is required." },
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
      { error: "Registration request not found." },
      { status: 404 },
    );
  }

  // 5. Only pending requests can be approved.
  if (registrationRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "This registration request has already been processed." },
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
      {
        error: "A user with this email address already exists.",
      },
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
      redirectTo: "http://localhost:3000/auth/confirm",
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
          "The invitation was sent, but the registration request could not be marked as approved.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
