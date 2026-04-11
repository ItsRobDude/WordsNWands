import type {
  CastResolution,
  EncounterRuntimeState,
  HeadlessTranscriptEntry,
} from "../../../../packages/game-rules/src/index.ts";

export const describeTileState = (state: string | null): string | null => {
  if (state === "bubble") return "Bubble";
  if (state === "dull") return "Dull";
  if (state === "frozen") return "Frozen";
  if (state === "sooted") return "Sooted";
  return null;
};

export const describeCastResolution = (
  transcriptEntry: HeadlessTranscriptEntry | null,
): string | null => {
  if (!transcriptEntry) {
    return null;
  }

  const { cast_resolution: castResolution, delta } = transcriptEntry;

  if (castResolution.submission_kind === "valid") {
    const spellLine =
      delta.countdown_after > delta.countdown_before
        ? " The creature answered with a spell."
        : "";

    return `${castResolution.normalized_word.toUpperCase()} hit for ${castResolution.damage_applied} ${castResolution.matchup_result} damage.${spellLine}`;
  }

  return describeRejectedResolution(castResolution);
};

export const describeStarterHint = (input: {
  runtime_state: EncounterRuntimeState;
  transcript_entry: HeadlessTranscriptEntry | null;
  encounter_id: string;
}): string | null => {
  if (input.encounter_id !== "enc_starter_001") {
    return null;
  }

  if (input.runtime_state.casts_resolved_count === 0) {
    return "Starter cue: trace LEAF across the first row to land your opening Bloom cast.";
  }

  if (input.transcript_entry?.cast_resolution.submission_kind === "valid") {
    return "Countdowns matter. Keep casting until Puddle Puff answers with a bubble spell, then look for a Light word like SUN.";
  }

  return "Try a fresh adjacent path. Repeated words and frozen tiles will be rejected by the rules engine.";
};

const describeRejectedResolution = (
  castResolution: Exclude<CastResolution, { submission_kind: "valid" }>,
): string => {
  if (castResolution.rejection_reason === "blocked_by_tile_state") {
    return "That path crossed a blocked tile state.";
  }

  if (castResolution.rejection_reason === "illegal_path") {
    return "Keep the trace to touching tiles with no repeats.";
  }

  if (castResolution.rejection_reason === "not_in_lexicon") {
    return "That trace is not in the current spell lexicon.";
  }

  if (castResolution.rejection_reason === "repeated_word") {
    return "That spell was already cast in this encounter.";
  }

  return "That trace is too short to cast.";
};
