import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <main className="dashboard-bg">
      <section className="dashboard-hero">
        <div>
          <p className="brand-eyebrow">SO Volunteering</p>
          <h1 className="page-title">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="page-lead">
            Your inclusive volunteering pathway dashboard is ready.
          </p>
        </div>

        <form action={signOut}>
          <button type="submit" className="secondary-button">
            Sign out
          </button>
        </form>
      </section>

      <section className="dashboard-grid">
        <article className="info-card">
          <h2>Your profile</h2>
          <p>
            Account type: <strong>{profile?.user_type ?? "volunteer"}</strong>
          </p>
          <p>{profile?.email}</p>
        </article>

        <article className="info-card">
          <h2>Opportunities</h2>
          <p>
            Browse inclusive volunteering opportunities and start building
            verified experience.
          </p>
        </article>

        <article className="info-card">
          <h2>Wellbeing</h2>
          <p>
            Support and safety features are built into the platform from the
            start.
          </p>
        </article>
      </section>
    </main>
  );
}
