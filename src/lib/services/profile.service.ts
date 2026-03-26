import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/db/supabase-server";

export interface AppUserProfile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
}

export async function syncUserProfileFromAuthUser(authUser: User) {
  const supabase = createSupabaseServerClient();

  const payload = {
    id: authUser.id,
    auth_user_id: authUser.id,
    email: authUser.email ?? "",
    full_name:
      (authUser.user_metadata.full_name as string | undefined) ??
      authUser.email ??
      "Member",
    role: ((authUser.user_metadata.role as string | undefined) ?? "user") as
      | "user"
      | "admin",
  };

  const { data, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" })
    .select("id, auth_user_id, email, full_name, role")
    .single();

  if (error) {
    throw new Error(`Failed to sync user profile: ${error.message}`);
  }

  return data as AppUserProfile;
}

export async function getAppUserProfileByAuthId(authUserId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, email, full_name, role")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  return (data as AppUserProfile | null) ?? null;
}
