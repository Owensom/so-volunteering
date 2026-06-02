import { redirect } from "next/navigation";
import { saveVolunteerSkills } from "./actions";
import { createClient } from "@/lib/supabase/server";
import {
  InclusiveAudioButton,
  IconLabel
} from "@/components/InclusiveSupport";
import {
  OnboardingProgress,
  ChoiceCards,
  OptionalTextarea
} from "@/components/InclusiveForm";

const interestOptions = [
  {
    value: "Helping people",
    label: "Helping people",
    icon: "🤝",
    helpText: "Supporting visitors, service users, neighbours or community members."
  },
  {
    value: "Animals and nature",
    label: "Animals and nature",
    icon: "🌿",
    helpText: "Outdoor roles, conservation, gardening, animal care or local green spaces."
  },
  {
    value: "Events and activities",
    label: "Events and activities",
    icon: "🎪",
    helpText: "Helping at community events, fundraisers, clubs or social activities."
  },
  {
    value: "Creative tasks",
    label: "Creative tasks",
    icon: "🎨",
    helpText: "Music, art, design, photography, writing or making things."
  },
  {
    value: "Practical tasks",
    label: "Practical tasks",
    icon: "🧰",
    helpText: "Setting up rooms, sorting donations, packing items or hands-on help."
  },
  {
    value: "Digital or admin",
    label: "Digital or admin",
    icon: "💻",
    helpText: "Computer tasks, forms, emails, spreadsheets, social media or organising."
  },
  {
    value: "Food and hospitality",
    label: "Food and hospitality",
    icon: "☕",
    helpText: "Serving refreshments, welcoming people, kitchen support or café-style roles."
  },
  {
    value: "Sport and wellbeing",
    label: "Sport and wellbeing",
    icon: "⚽",
    helpText: "Active roles, wellbeing groups, walking groups or gentle exercise support."
  }
];

const skillOptions = [
  {
    value: "Being friendly and welcoming",
    label: "Being friendly and welcoming",
    icon: "😊",
    helpText: "Helping people feel comfortable and included."
  },
  {
    value: "Listening to people",
    label: "Listening to people",
    icon: "👂",
    helpText: "Giving people time, patience and attention."
  },
  {
    value: "Following instructions",
    label: "Following instructions",
    icon: "✅",
    helpText: "Working through clear steps safely and carefully."
  },
  {
    value: "Organising things",
    label: "Organising things",
    icon: "🗂️",
    helpText: "Sorting, planning, tidying, arranging or keeping things on track."
  },
  {
    value: "Using a phone or computer",
    label: "Using a phone or computer",
    icon: "📱",
    helpText: "Basic digital tasks, messages, online forms or simple computer work."
  },
  {
    value: "Teamwork",
    label: "Teamwork",
    icon: "👥",
    helpText: "Working with other people towards a shared goal."
  },
  {
    value: "Problem solving",
    label: "Problem solving",
    icon: "🧩",
    helpText: "Finding practical ways to help when something changes."
  },
  {
    value: "I am still finding my skills",
    label: "I am still finding my skills",
    icon: "🌱",
    helpText: "That is completely fine. Volunteering can help you discover them."
  }
];

export default async function VolunteerSkillsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? decodeURIComponent(params.error) : "";

  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const listenText =
    "This is step two of your volunteer profile setup. This page is called Skills and interests. First, choose the things you enjoy or might like to try. Next, choose skills you already have or would like to build. You can choose more than one option. You do not need to type anything unless you want to. Near the bottom of the page there is an optional box where you can add anything else. The final button says Save and continue.";

  return (
    <main className="center-shell">
      <section className="auth-card onboarding-card">
        <div className="page-top-row">
          <p className="brand-eyebrow">Profile setup</p>
          <InclusiveAudioButton text={listenText} />
        </div>

        <h1 className="page-title">
          <IconLabel icon="🧩">Skills & interests</IconLabel>
        </h1>

        <p className="page-lead">
          Choose what you enjoy, what you can already do, and what you might like
          to build. This helps us suggest opportunities that feel realistic,
          useful and encouraging.
        </p>

        <OnboardingProgress step={2} total={4} />

        {errorMessage ? (
          <div className="alert alert-error">{errorMessage}</div>
        ) : null}

        <form action={saveVolunteerSkills} className="form-stack">
          <fieldset className="choice-group">
            <legend>
              <IconLabel icon="💚">Things I enjoy or might like to try</IconLabel>
            </legend>
            <ChoiceCards name="interests" options={interestOptions} />
          </fieldset>

          <fieldset className="choice-group">
            <legend>
              <IconLabel icon="⭐">Skills I have or want to build</IconLabel>
            </legend>
            <ChoiceCards name="skills" options={skillOptions} />
          </fieldset>

          <OptionalTextarea
            name="bio"
            label="Optional: tell us anything else in your own words"
            placeholder="You can leave this blank. Example: I like working with animals, I prefer practical tasks, or I would like to build confidence talking to people."
          />

          <button type="submit" className="primary-button">
            <IconLabel icon="➡️">Save and continue</IconLabel>
          </button>
        </form>
      </section>
    </main>
  );
}
