import type { MilestoneTemplate } from "../types";
import type { HackathonType, MilestoneKind } from "../types/enums";

const m = (
  key: string,
  kind: MilestoneKind,
  title: string,
  requiresAction = true,
  isHardDeadline = true,
): MilestoneTemplate => ({ key, kind, title, requiresAction, isHardDeadline });

/** Default lifecycle per hackathon type. Dates are filled in by the user. */
export const LIFECYCLE_TEMPLATES: Record<HackathonType, MilestoneTemplate[]> = {
  BUILDATHON: [
    m("registration", "REGISTRATION", "Registration"),
    m("team_formation", "TEAM_FORMATION", "Team formation", true, false),
    m("idea_submission", "IDEA_SUBMISSION", "Idea / PPT submission"),
    m("shortlist", "SHORTLIST", "Shortlist", false, false),
    m("final_submission", "FINAL_SUBMISSION", "Final submission"),
    m("demo", "DEMO", "Demo / pitch"),
    m("results", "RESULTS", "Results", false, false),
  ],
  IDEATHON: [
    m("registration", "REGISTRATION", "Registration"),
    m("idea_submission", "IDEA_SUBMISSION", "Idea submission"),
    m("shortlist", "SHORTLIST", "Shortlist", false, false),
    m("demo", "DEMO", "Pitch"),
    m("results", "RESULTS", "Results", false, false),
  ],
  CTF: [
    m("registration", "REGISTRATION", "Registration"),
    m("event_start", "EVENT_START", "CTF starts", false, false),
    m("event_end", "EVENT_END", "CTF ends", false, false),
    m("writeups", "REPORT", "Writeups", true, false),
    m("results", "RESULTS", "Results", false, false),
  ],
  DSA: [
    m("registration", "REGISTRATION", "Registration"),
    m("round_1", "ROUND", "Round 1"),
    m("round_2", "ROUND", "Round 2"),
    m("final", "ROUND", "Final"),
    m("results", "RESULTS", "Results", false, false),
  ],
  GRANT: [
    m("application", "IDEA_SUBMISSION", "Proposal / application"),
    m("review", "SHORTLIST", "Review", false, false),
    m("interview", "DEMO", "Interview"),
    m("milestone_1", "PROTOTYPE", "Milestone 1 delivery"),
    m("report", "REPORT", "Report"),
    m("payout", "PAYOUT", "Payout", false, false),
  ],
  BOUNTY: [
    m("claim", "REGISTRATION", "Claim / start"),
    m("final_submission", "FINAL_SUBMISSION", "Submit"),
    m("review", "RESULTS", "Review", false, false),
    m("payout", "PAYOUT", "Payout", false, false),
  ],
  OTHER: [m("registration", "REGISTRATION", "Registration"), m("final_submission", "FINAL_SUBMISSION", "Submission")],
};
