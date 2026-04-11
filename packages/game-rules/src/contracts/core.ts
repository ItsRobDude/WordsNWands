export type ElementType =
  | "flame"
  | "tide"
  | "bloom"
  | "storm"
  | "stone"
  | "light"
  | "arcane";

export type NonNeutralElementType = Exclude<ElementType, "arcane">;

export type EncounterType = "standard" | "boss" | "event";

export type DifficultyTier =
  | "gentle"
  | "standard"
  | "challenging"
  | "boss"
  | "event";

export type TileStateKind = "frozen" | "sooted" | "dull" | "bubble";

export type TileSpecialMarkerKind = "wand";

export type MatchupResult = "weakness" | "neutral" | "resistance";

export type EncounterOutcome = "won" | "lost";

export type EncounterTerminalReasonCode =
  | "none"
  | "normal_win"
  | "moves_exhausted"
  | "manual_abandon"
  | "spark_shuffle_retry_cap_unrecoverable";

export type CastSubmissionKind = "valid" | "invalid" | "repeated";

export type CastRejectionReason =
  | "illegal_path"
  | "too_short"
  | "not_in_lexicon"
  | "blocked_by_tile_state"
  | "repeated_word";

export type EncounterSessionState =
  | "unopened"
  | "intro_presented"
  | "in_progress"
  | "won"
  | "lost"
  | "recoverable_error"
  | "abandoned";

export type EncounterSessionTransition =
  | "open_encounter"
  | "dismiss_intro"
  | "submit_valid_cast"
  | "submit_invalid_cast"
  | "submit_repeated_cast"
  | "resolve_creature_spell"
  | "trigger_spark_shuffle"
  | "spark_shuffle_unrecoverable_failure"
  | "win"
  | "lose"
  | "restart"
  | "abandon";

export type AppPrimarySurface =
  | "starter_flow"
  | "home"
  | "encounter"
  | "result"
  | "settings"
  | "profile";

export type StarterTutorialCueStage =
  | "none"
  | "cue_01_trace_word"
  | "cue_02_release_to_cast"
  | "cue_03_read_countdown"
  | "cue_04_watch_creature_spell"
  | "cue_05_loss_retry_prompt"
  | "cue_06_win_next_step"
  | "completed";

export type StarterTutorialBlockState = "none" | "blocked" | "non_blocking";
