import type { AppPrimarySurface, EncounterSessionState } from "./core.js";

export type EncounterStateTransitionMap = {
  unopened: "intro_presented" | "in_progress" | "abandoned";
  intro_presented: "in_progress" | "abandoned";
  in_progress:
    | "in_progress"
    | "won"
    | "lost"
    | "recoverable_error"
    | "abandoned";
  won: never;
  lost: never;
  recoverable_error: never;
  abandoned: never;
};

export interface EncounterRestoreTarget {
  surface: AppPrimarySurface;
  encounter_session_id: string | null;
  encounter_id: string | null;
  result_record_id: string | null;
}

export type LaunchResumePhase =
  | "app_init"
  | "profile_load"
  | "manifest_validate"
  | "validation_hydrate"
  | "active_snapshot_load"
  | "restore_target_derive"
  | "route_commit";

export interface LaunchResumeTransitionState {
  phase: LaunchResumePhase;
  attempt_id: string;
  started_at_utc: string;
  completed_phases: LaunchResumePhase[];
  restore_target: EncounterRestoreTarget | null;
}

export type TerminalEncounterSessionState = Extract<
  EncounterSessionState,
  "won" | "lost" | "recoverable_error" | "abandoned"
>;
