import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegistrationRequests from "@/components/admin/registration-requests";

export default async function AdminRequestsContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "ADMIN") {
    redirect("/protected");
  }

  const { data: requests, error: requestsError } = await supabase
    .from("registration_requests")
    .select("id, name, email, status, created_at")
    .order("created_at", { ascending: false });

  if (requestsError) {
    throw new Error(requestsError.message);
  }

  return <RegistrationRequests requests={requests ?? []} />;
}
