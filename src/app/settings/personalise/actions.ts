"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  user_type: string | null;
};

function normaliseUserType(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "organisation"
    ? "organisation"
    : "volunteer";
}

function normaliseViewMode(value: string) {
  if (value === "simple" || value === "detailed") {
    return value;
  }

  return "standard";
}

function normaliseColourTheme(value: string) {
  if (
    value === "calm_green" ||
    value === "soft_blue" ||
    value === "warm_peach" ||
    value === "high_contrast" ||
    value === "neon_arcade"
  ) {
    return value;
  }

  return "default";
}

function normaliseTextSize(value: string) {
  return value === "large" ? "large" : "standard";
}

function normaliseListenMode(value: string) {
  return value === "context" ? "context" : "always";
}

function normaliseAvatarIcon(value: string) {
  const allowedAvatars = new Set([
    "🌱",
    "🌈",
    "⭐",
    "🎨",
    "💻",
    "🧰",
    "☕",
    "🐾",
    "🎵",
    "🤝",
    "📚",
    "⚽",
    "🎮",
    "🕹️",
    "🚀",
  ]);

  return allowedAvatars.has(value) ? value : "🌱";
}

export async function saveVolunteerPreferences(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const metadataUserType =
    typeof user.user_metadata?.user_type === "string"
      ? user.user_metadata.user_type
      : "volunteer";

  const userType = normaliseUserType(profile?.user_type || metadataUserType);

  if (userType === "organisation") {
    redirect("/organisation/dashboard");
  }

  const viewMode = normaliseViewMode(String(formData.get("view_mode") || ""));
  const colourTheme = normaliseColourTheme(
    String(formData.get("colour_theme") || ""),
  );
  const textSize = normaliseTextSize(String(formData.get("text_size") || ""));
  const avatarIcon = normaliseAvatarIcon(
    String(formData.get("avatar_icon") || ""),
  );
  const listenMode = normaliseListenMode(
    String(formData.get("listen_mode") || ""),
  );

  const { error } = await supabase.from("volunteer_preferences").upsert(
    {
      user_id: user.id,
      view_mode: viewMode,
      colour_theme: colourTheme,
      text_size: textSize,
      avatar_icon: avatarIcon,
      listen_mode: listenMode,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    redirect(`/settings/personalise?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/settings/personalise?message=${encodeURIComponent(
      "Your app preferences have been saved.",
    )}`,
  );
}
