import type { EncounterOutcome } from "./core.js";

export type ProgressionTopology = "chapter_linear_v1";
export type MainlineUnlockCondition = "win_any_stars";
export type StarRating = 0 | 1 | 2 | 3;
export type StarPolicyVersion =
  | "star_policy_v1_absolute"
  | "star_policy_v2_percentage";

export interface RuntimeProgressionDefinition {
  progression_version: string;
  topology: "chapter_linear_v1";
  starter_encounter_id: string;
  chapters: RuntimeProgressionChapterDefinition[];
}

export interface RuntimeProgressionChapterDefinition {
  chapter_id: string;
  display_name: string;
  habitat_theme_id: string;
  sort_index: number;
  encounter_ids: string[];
}

export function deriveStarRating(
  outcome: EncounterOutcome,
  moves_remaining: number,
  move_budget_total: number,
  star_policy_version: StarPolicyVersion,
): StarRating {
  if (outcome === "lost") {
    return 0;
  }

  if (star_policy_version === "star_policy_v1_absolute") {
    if (moves_remaining >= 4) return 3;
    if (moves_remaining >= 2) return 2;
    return 1;
  }

  if (move_budget_total < 1) {
    return 1;
  }

  const remainingPercentFloor = Math.max(
    0,
    Math.min(100, Math.floor((moves_remaining / move_budget_total) * 100)),
  );

  if (remainingPercentFloor >= 30) return 3;
  if (remainingPercentFloor >= 15) return 2;
  return 1;
}
