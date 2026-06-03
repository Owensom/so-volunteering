"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  full_name: string | null;
  email: string | null;
  user_type: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value === "organisation" ? "organisation" : "volunteer";
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const userType = normaliseUserType(String(formData.get("user_type") || "volunteer"));

  if (!email || !password || !fullName) {
    redirect("/signup?error=missing_fields");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  /*
    Best-effort profile sync.

    If email confirmation is enabled, Supabase may not create an authenticated
    session immediately, so this write may be blocked by RLS. That is fine:
    login also syncs/falls back to auth metadata. Do not fail account creation
    just because the profile row cannot be updated here.
  */
  if (data.user?.id) {
    await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          email,
          user_type: userType,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
  }

  redirect("/login?message=account_created");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=missing_fields");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Unable%20to%20load%20your%20account.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType = normaliseUserType(
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : undefined
  );

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  /*
    Best-effort profile repair. This keeps older accounts usable where email
    or user_type may not have been stored in public.profiles yet.
  */
  await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name:
          profile?.full_name ||
          (typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null),
        email: profile?.email || user.email || email,
        user_type: userType,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
