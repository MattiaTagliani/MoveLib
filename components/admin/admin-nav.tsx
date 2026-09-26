import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") {
    return null;
  }

  return (
    <Link
      href="/protected/admin/requests"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Admin
    </Link>
  );
}
