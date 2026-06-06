export type VolunteerMatchProfile = {
  goals?: string[] | null;
  interests?: string[] | null;
  skills?: string[] | null;
  volunteering_preference?: string | null;
  support_needs?: string | null;
  share_accessibility_needs?: boolean | null;
  availability_notes?: string | null;
};

export type MatchableOpportunity = {
  title?: string | null;
  location_type?: string | null;
  interests?: string[] | null;
  skills?: string[] | null;
  support_offered?: string[] | null;
  time_commitment?: string | null;
};

export type OpportunityMatchTone = "strong" | "good" | "explore";

export type OpportunityMatchResult = {
  score: number;
  tone: OpportunityMatchTone;
  label: string;
  shortLabel: string;
  summary: string;
  reasons: string[];
  interestMatches: string[];
  skillMatches: string[];
  supportAvailable: boolean;
  locationPreferenceMatch: boolean;
  hasVolunteerProfileData: boolean;
};

function normaliseText(value: string) {
  return value.trim().toLowerCase();
}

function normaliseList(values: string[] | null | undefined) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function getSharedValues(
  volunteerValues: string[] | null | undefined,
  opportunityValues: string[] | null | undefined,
) {
  const volunteerList = normaliseList(volunteerValues);
  const opportunityList = normaliseList(opportunityValues);

  if (!volunteerList.length || !opportunityList.length) {
    return [];
  }

  const volunteerSet = new Set(volunteerList.map(normaliseText));

  return opportunityList.filter((value) => volunteerSet.has(normaliseText(value)));
}

function normaliseVolunteeringPreference(value: string | null | undefined) {
  if (value === "in_person" || value === "remote" || value === "both") {
    return value;
  }

  return "";
}

function normaliseLocationType(value: string | null | undefined) {
  if (value === "remote" || value === "hybrid" || value === "in_person") {
    return value;
  }

  if (value === "in-person") {
    return "in_person";
  }

  return "";
}

function getLocationPreferenceMatch(
  volunteerPreference: string | null | undefined,
  opportunityLocationType: string | null | undefined,
) {
  const preference = normaliseVolunteeringPreference(volunteerPreference);
  const locationType = normaliseLocationType(opportunityLocationType);

  if (!preference || !locationType) {
    return false;
  }

  if (preference === "both") {
    return true;
  }

  if (preference === "remote") {
    return locationType === "remote" || locationType === "hybrid";
  }

  if (preference === "in_person") {
    return locationType === "in_person" || locationType === "hybrid";
  }

  return false;
}

function hasProfileData(volunteerProfile: VolunteerMatchProfile | null | undefined) {
  if (!volunteerProfile) {
    return false;
  }

  return (
    normaliseList(volunteerProfile.goals).length > 0 ||
    normaliseList(volunteerProfile.interests).length > 0 ||
    normaliseList(volunteerProfile.skills).length > 0 ||
    Boolean(normaliseVolunteeringPreference(volunteerProfile.volunteering_preference)) ||
    Boolean(volunteerProfile.support_needs?.trim()) ||
    Boolean(volunteerProfile.availability_notes?.trim())
  );
}

function getTone(score: number): OpportunityMatchTone {
  if (score >= 70) {
    return "strong";
  }

  if (score >= 35) {
    return "good";
  }

  return "explore";
}

function getLabel(tone: OpportunityMatchTone) {
  if (tone === "strong") {
    return "Strong match";
  }

  if (tone === "good") {
    return "Good match";
  }

  return "Worth exploring";
}

function getShortLabel(tone: OpportunityMatchTone) {
  if (tone === "strong") {
    return "Strong";
  }

  if (tone === "good") {
    return "Good";
  }

  return "Explore";
}

function buildReasons({
  interestMatches,
  skillMatches,
  supportAvailable,
  locationPreferenceMatch,
  hasVolunteerProfileData,
}: {
  interestMatches: string[];
  skillMatches: string[];
  supportAvailable: boolean;
  locationPreferenceMatch: boolean;
  hasVolunteerProfileData: boolean;
}) {
  const reasons: string[] = [];

  if (interestMatches.length > 0) {
    reasons.push(
      `${interestMatches.length} interest match${
        interestMatches.length === 1 ? "" : "es"
      }`,
    );
  }

  if (skillMatches.length > 0) {
    reasons.push(
      `${skillMatches.length} skill match${skillMatches.length === 1 ? "" : "es"}`,
    );
  }

  if (locationPreferenceMatch) {
    reasons.push("Matches your volunteering preference");
  }

  if (supportAvailable) {
    reasons.push("Support is listed for this role");
  }

  if (!reasons.length && hasVolunteerProfileData) {
    reasons.push("This may still be worth exploring");
  }

  if (!reasons.length) {
    reasons.push("Build your profile to improve matching");
  }

  return reasons;
}

function buildSummary(
  tone: OpportunityMatchTone,
  reasons: string[],
  hasVolunteerProfileData: boolean,
) {
  if (!hasVolunteerProfileData) {
    return "Add your interests, skills and preferences to improve your role matches.";
  }

  if (tone === "strong") {
    return "This role looks like a strong fit based on your profile.";
  }

  if (tone === "good") {
    return "This role has some useful links to your profile.";
  }

  if (reasons.includes("This may still be worth exploring")) {
    return "This role does not strongly match your profile yet, but it may still be worth exploring.";
  }

  return "This role may be worth exploring.";
}

export function getOpportunityMatch(
  volunteerProfile: VolunteerMatchProfile | null | undefined,
  opportunity: MatchableOpportunity,
): OpportunityMatchResult {
  const interestMatches = getSharedValues(
    volunteerProfile?.interests,
    opportunity.interests,
  );

  const skillMatches = getSharedValues(volunteerProfile?.skills, opportunity.skills);

  const supportAvailable = normaliseList(opportunity.support_offered).length > 0;

  const locationPreferenceMatch = getLocationPreferenceMatch(
    volunteerProfile?.volunteering_preference,
    opportunity.location_type,
  );

  const hasVolunteerProfileData = hasProfileData(volunteerProfile);

  let score = 0;

  score += Math.min(interestMatches.length * 20, 40);
  score += Math.min(skillMatches.length * 15, 30);

  if (locationPreferenceMatch) {
    score += 15;
  }

  if (supportAvailable) {
    score += 10;
  }

  if (volunteerProfile?.support_needs?.trim() && supportAvailable) {
    score += 5;
  }

  score = Math.min(score, 100);

  const tone = getTone(score);
  const label = getLabel(tone);
  const shortLabel = getShortLabel(tone);

  const reasons = buildReasons({
    interestMatches,
    skillMatches,
    supportAvailable,
    locationPreferenceMatch,
    hasVolunteerProfileData,
  });

  const summary = buildSummary(tone, reasons, hasVolunteerProfileData);

  return {
    score,
    tone,
    label,
    shortLabel,
    summary,
    reasons,
    interestMatches,
    skillMatches,
    supportAvailable,
    locationPreferenceMatch,
    hasVolunteerProfileData,
  };
}

export function getOpportunityMatchCardIcon(tone: OpportunityMatchTone) {
  if (tone === "strong") {
    return "🌟";
  }

  if (tone === "good") {
    return "✨";
  }

  return "🌈";
}

export function getOpportunityMatchToneClass(tone: OpportunityMatchTone) {
  if (tone === "strong") {
    return "match-tone-strong";
  }

  if (tone === "good") {
    return "match-tone-good";
  }

  return "match-tone-explore";
}
