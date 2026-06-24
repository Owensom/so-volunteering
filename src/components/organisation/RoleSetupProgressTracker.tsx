"use client";

import { useEffect } from "react";

type RoleStep = {
  complete: boolean;
  title: string;
  text: string;
};

function getTextValue(form: HTMLFormElement, name: string) {
  const field = form.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(`[name="${name}"]`);

  return typeof field?.value === "string" ? field.value.trim() : "";
}

function getSelectValue(form: HTMLFormElement, name: string) {
  return getTextValue(form, name);
}

function getCheckedCount(form: HTMLFormElement, name: string) {
  return form.querySelectorAll<HTMLInputElement>(`[name="${name}"]:checked`)
    .length;
}

function isChecked(form: HTMLFormElement, name: string) {
  const field = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
  return field?.checked === true;
}

function setComplete(stepNumber: number, complete: boolean) {
  const guide = document.querySelector<HTMLElement>(
    `[data-role-guide-step="${stepNumber}"]`,
  );
  const guideStatus = document.querySelector<HTMLElement>(
    `[data-role-guide-status="${stepNumber}"]`,
  );
  const guideNumber = guide?.querySelector<HTMLElement>(
    ".role-guide-step-number",
  );
  const section = document.querySelector<HTMLElement>(
    `[data-role-step="${stepNumber}"]`,
  );
  const sectionStatus = document.querySelector<HTMLElement>(
    `[data-role-step-status="${stepNumber}"]`,
  );

  if (guide) {
    guide.classList.toggle("role-guide-step-complete", complete);
    guide.setAttribute(
      "aria-label",
      complete ? `Step ${stepNumber} complete` : `Step ${stepNumber} to do`,
    );
  }

  if (guideStatus) {
    guideStatus.textContent = complete ? "Complete" : "To do";
  }

  if (guideNumber) {
    guideNumber.textContent = complete ? "✓" : String(stepNumber);
  }

  if (section) {
    section.classList.toggle("role-step-complete", complete);
  }

  if (sectionStatus) {
    sectionStatus.replaceChildren();

    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = complete ? "✅" : "○";

    sectionStatus.appendChild(icon);
    sectionStatus.append(complete ? "Complete" : "To do");
  }
}

function setCurrentStep(
  nextStepNumber: number,
  nextStepTitle: string,
  nextStepText: string,
) {
  const allGuideSteps = document.querySelectorAll<HTMLElement>(
    "[data-role-guide-step]",
  );
  const allSections =
    document.querySelectorAll<HTMLElement>("[data-role-step]");
  const nextCard = document.querySelector<HTMLElement>(
    "[data-role-next-step-card]",
  );
  const nextTitle = document.querySelector<HTMLElement>(
    "[data-role-next-step-title]",
  );
  const nextText = document.querySelector<HTMLElement>(
    "[data-role-next-step-text]",
  );
  const nextLink = document.querySelector<HTMLAnchorElement>(
    "[data-role-next-step-link]",
  );

  allGuideSteps.forEach((node) => {
    const nodeStep = node.getAttribute("data-role-guide-step");
    node.classList.toggle(
      "role-guide-step-current",
      nodeStep === String(nextStepNumber),
    );
  });

  allSections.forEach((node) => {
    const nodeStep = node.getAttribute("data-role-step");
    node.classList.toggle(
      "role-step-current",
      nodeStep === String(nextStepNumber),
    );
  });

  if (nextCard) {
    nextCard.classList.toggle(
      "role-next-step-card-complete",
      nextStepNumber === 10,
    );
  }

  if (nextTitle) {
    nextTitle.textContent =
      nextStepNumber === 10
        ? "All required setup steps are ready"
        : `Step ${nextStepNumber} · ${nextStepTitle}`;
  }

  if (nextText) {
    nextText.textContent =
      nextStepNumber === 10
        ? "Review the role, then save as draft or publish when ready."
        : nextStepText;
  }

  if (nextLink) {
    nextLink.setAttribute(
      "href",
      nextStepNumber === 10 ? "#role-step-9" : `#role-step-${nextStepNumber}`,
    );
    nextLink.textContent =
      nextStepNumber === 10 ? "Review and save" : "Go to step";
  }
}

function updateRoleProgress() {
  const form = document.querySelector<HTMLFormElement>(
    "[data-role-create-form]",
  );

  if (!form) return;

  const locationType = getSelectValue(form, "location_type");
  const hasSafeLocation = Boolean(
    locationType === "remote" ||
      getTextValue(form, "location_town_city") ||
      getTextValue(form, "location_area") ||
      getTextValue(form, "location") ||
      getTextValue(form, "location_venue"),
  );

  const hasLegalReadiness = Boolean(
    getSelectValue(form, "minimum_age_stage") !== "not_set" ||
      getSelectValue(form, "safeguarding_check_region") !==
        "organisation_default" ||
      getSelectValue(form, "role_frequency_pattern") !== "not_set" ||
      isChecked(form, "suitable_for_pupils") ||
      isChecked(form, "parent_carer_consent_required") ||
      isChecked(form, "school_approval_required") ||
      isChecked(form, "safeguarding_review_required") ||
      isChecked(form, "supervision_required") ||
      isChecked(form, "no_lone_working") ||
      isChecked(form, "no_home_visits") ||
      isChecked(form, "no_money_handling") ||
      isChecked(form, "no_personal_care") ||
      isChecked(form, "no_private_messaging") ||
      isChecked(form, "risk_assessment_completed") ||
      getTextValue(form, "named_safeguarding_contact") ||
      getTextValue(form, "legal_safeguarding_notes"),
  );

  const steps: RoleStep[] = [
    {
      complete: Boolean(
        getTextValue(form, "title") && getTextValue(form, "summary"),
      ),
      title: "Role title and summary",
      text: "Add a short title and plain-language summary first.",
    },
    {
      complete: hasSafeLocation,
      title: "Location and travel",
      text: "Add a safe town, city, area, venue, or choose remote.",
    },
    {
      complete: Boolean(getSelectValue(form, "time_commitment")),
      title: "Time commitment",
      text: "Choose the time pattern that best explains the role.",
    },
    {
      complete: Boolean(
        getCheckedCount(form, "interests") > 0 &&
          getCheckedCount(form, "skills") > 0,
      ),
      title: "Interests and skills",
      text: "Choose at least one interest and one skill.",
    },
    {
      complete: Boolean(getCheckedCount(form, "support_offered") > 0),
      title: "Support offered",
      text: "Choose the support volunteers can expect.",
    },
    {
      complete: Boolean(getTextValue(form, "contact_email")),
      title: "Contact person",
      text: "Add the email address your organisation checks.",
    },
    {
      complete: Boolean(
        getTextValue(form, "safety_notes") ||
          getTextValue(form, "travel_notes") ||
          getTextValue(form, "accessibility_notes") ||
          isChecked(form, "hide_exact_location"),
      ),
      title: "Safety and first visit notes",
      text: "Add safety, welcome, travel, access or privacy information.",
    },
    {
      complete: hasLegalReadiness,
      title: "Legal and safeguarding readiness",
      text: "Record safeguarding, consent, supervision or review information.",
    },
    {
      complete: Boolean(getSelectValue(form, "status")),
      title: "Save or publish",
      text: "Choose draft or publish, then save the role.",
    },
  ];

  let completeCount = 0;
  let nextStepNumber = 10;
  let nextStepTitle = "";
  let nextStepText = "";

  steps.forEach((step, index) => {
    if (step.complete) {
      completeCount += 1;
    } else if (nextStepNumber === 10) {
      nextStepNumber = index + 1;
      nextStepTitle = step.title;
      nextStepText = step.text;
    }

    setComplete(index + 1, step.complete);
  });

  setCurrentStep(nextStepNumber, nextStepTitle, nextStepText);

  const completeCountNode = document.querySelector<HTMLElement>(
    "[data-role-complete-count]",
  );
  const meterNode = document.querySelector<HTMLElement>(
    "[data-role-progress-meter]",
  );
  const percent = Math.round((completeCount / steps.length) * 100);

  if (completeCountNode) {
    completeCountNode.textContent = String(completeCount);
  }

  if (meterNode) {
    meterNode.style.width = `${percent}%`;
  }
}

export function RoleSetupProgressTracker() {
  useEffect(() => {
    let updateTimer: number | null = null;
    let longerTimer: number | null = null;
    let initialTimer: number | null = null;
    let lateInitialTimer: number | null = null;

    function scheduleRoleProgressUpdate() {
      if (updateTimer) {
        window.clearTimeout(updateTimer);
      }

      if (longerTimer) {
        window.clearTimeout(longerTimer);
      }

      updateRoleProgress();

      updateTimer = window.setTimeout(() => {
        updateRoleProgress();
      }, 80);

      longerTimer = window.setTimeout(() => {
        updateRoleProgress();
      }, 260);
    }

    const form = document.querySelector<HTMLFormElement>(
      "[data-role-create-form]",
    );

    if (!form) return;

    const events: Array<keyof HTMLElementEventMap> = [
      "input",
      "change",
      "keyup",
      "blur",
      "paste",
      "click",
      "touchend",
      "compositionend",
    ];

    const controls = form.querySelectorAll<HTMLElement>(
      "input, textarea, select, [data-role-progress-control]",
    );

    controls.forEach((control) => {
      events.forEach((eventName) => {
        control.addEventListener(eventName, scheduleRoleProgressUpdate, {
          passive: true,
        });
      });
    });

    events.forEach((eventName) => {
      form.addEventListener(eventName, scheduleRoleProgressUpdate, true);
    });

    window.addEventListener("pageshow", scheduleRoleProgressUpdate);
    window.addEventListener("focus", scheduleRoleProgressUpdate);
    window.addEventListener("resize", scheduleRoleProgressUpdate);
    document.addEventListener("visibilitychange", scheduleRoleProgressUpdate);

    scheduleRoleProgressUpdate();

    initialTimer = window.setTimeout(() => {
      updateRoleProgress();
    }, 350);

    lateInitialTimer = window.setTimeout(() => {
      updateRoleProgress();
    }, 900);

    return () => {
      if (updateTimer) {
        window.clearTimeout(updateTimer);
      }

      if (longerTimer) {
        window.clearTimeout(longerTimer);
      }

      if (initialTimer) {
        window.clearTimeout(initialTimer);
      }

      if (lateInitialTimer) {
        window.clearTimeout(lateInitialTimer);
      }

      controls.forEach((control) => {
        events.forEach((eventName) => {
          control.removeEventListener(eventName, scheduleRoleProgressUpdate);
        });
      });

      events.forEach((eventName) => {
        form.removeEventListener(eventName, scheduleRoleProgressUpdate, true);
      });

      window.removeEventListener("pageshow", scheduleRoleProgressUpdate);
      window.removeEventListener("focus", scheduleRoleProgressUpdate);
      window.removeEventListener("resize", scheduleRoleProgressUpdate);
      document.removeEventListener(
        "visibilitychange",
        scheduleRoleProgressUpdate,
      );
    };
  }, []);

  return null;
}
