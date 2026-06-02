import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { InclusiveAudioButton, IconLabel } from "@/components/InclusiveSupport";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,user_type")
    .eq("id", user.id)
    .single();

  const listenText =
    "This is your SO Volunteering dashboard. From here you can complete your profile, find opportunities, and use wellbeing support features.";

  return (
    <main className="dashboard-bg">
      <section className="dashboard-hero">
        <div>
          <div className="page-top-row">
            <p className="brand-eyebrow">SO Volunteering</p>
            <InclusiveAudioButton text={listenText} />
          </div>

          <h1 className="page-title">
            <IconLabel icon="👋">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
            </IconLabel>
          </h1>

          <p className="page-lead">
            Your inclusive volunteering pathway dashboard is ready.
          </p>
        </div>

        <form action={signOut}>
          <button type="submit" className="secondary-button">
            <IconLabel icon="🚪">Sign out</IconLabel>
          </button>
        </form>
      </section>

      <section className="dashboard-grid">
        <article className="info-card">
          <h2>
            <IconLabel icon="👤">Your profile</IconLabel>
          </h2>
          <p>
            Account type: <strong>{profile?.user_type ?? "volunteer"}</strong>
          </p>
          <p>{profile?.email}</p>
          {profile?.user_type === "volunteer" ? (
            <p className="card-action">
              <Link href="/onboarding/volunteer" className="text-link">
                Continue volunteer setup
              </Link>
            </p>
          ) : null}
        </article>

        <article className="info-card">
          <h2>
            <IconLabel icon="🔎">Opportunities</IconLabel>
          </h2>
          <p>
            Browse inclusive volunteering opportunities and start building
            verified experience.
          </p>
        </article>

        <article className="info-card">
          <h2>
            <IconLabel icon="💛">Wellbeing</IconLabel>
          </h2>
          <p>
            Support and safety features are built into the platform from the
            start.
          </p>
        </article>
      </section>
    </main>
  );
}
