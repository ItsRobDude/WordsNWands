import type {
  BoardSnapshot,
  EncounterRngStreamStates,
} from "../contracts/board.js";

import {
  evaluateBoardQuality,
  type BoardAcceptancePolicy,
  type BoardQualityEvaluation,
} from "./boardAcceptance.ts";

export interface GeneratedBoardCandidate {
  board: BoardSnapshot;
  rng_stream_states: EncounterRngStreamStates;
}

export interface SelectBestBoardCandidateInput {
  initial_candidate: GeneratedBoardCandidate;
  candidate_search_attempts: number;
  policy: BoardAcceptancePolicy;
  next_candidate: (
    candidate: GeneratedBoardCandidate,
  ) => GeneratedBoardCandidate;
}

interface RatedBoardCandidate {
  candidate: GeneratedBoardCandidate;
  quality: BoardQualityEvaluation;
}

export const selectBestBoardCandidate = ({
  initial_candidate,
  candidate_search_attempts,
  policy,
  next_candidate,
}: SelectBestBoardCandidateInput): GeneratedBoardCandidate => {
  const total_attempts = Math.max(1, candidate_search_attempts);
  let active_candidate = initial_candidate;
  let last_candidate = initial_candidate;
  let best_accepted_candidate: RatedBoardCandidate | null = null;
  let best_safe_candidate: RatedBoardCandidate | null = null;
  let best_overall_candidate: RatedBoardCandidate | null = null;

  for (
    let attempt_index = 0;
    attempt_index < total_attempts;
    attempt_index += 1
  ) {
    const rated_candidate: RatedBoardCandidate = {
      candidate: active_candidate,
      quality: evaluateBoardQuality({
        board: active_candidate.board,
        policy,
      }),
    };

    best_overall_candidate = choosePreferredCandidate(
      best_overall_candidate,
      rated_candidate,
    );

    if (rated_candidate.quality.playable_word_count > 0) {
      best_safe_candidate = choosePreferredCandidate(
        best_safe_candidate,
        rated_candidate,
      );
    }

    if (rated_candidate.quality.accepted) {
      best_accepted_candidate = choosePreferredCandidate(
        best_accepted_candidate,
        rated_candidate,
      );
    }

    last_candidate = active_candidate;

    if (attempt_index < total_attempts - 1) {
      active_candidate = next_candidate(active_candidate);
    }
  }

  const selected_candidate =
    best_accepted_candidate?.candidate ??
    best_safe_candidate?.candidate ??
    best_overall_candidate?.candidate ??
    last_candidate;

  return {
    ...selected_candidate,
    board: {
      ...selected_candidate.board,
      rng_stream_states: last_candidate.rng_stream_states,
    },
    rng_stream_states: last_candidate.rng_stream_states,
  };
};

const choosePreferredCandidate = (
  current_best: RatedBoardCandidate | null,
  next_candidate: RatedBoardCandidate,
): RatedBoardCandidate => {
  if (!current_best) {
    return next_candidate;
  }

  if (next_candidate.quality.accepted !== current_best.quality.accepted) {
    return next_candidate.quality.accepted ? next_candidate : current_best;
  }

  if (next_candidate.quality.score !== current_best.quality.score) {
    return next_candidate.quality.score > current_best.quality.score
      ? next_candidate
      : current_best;
  }

  if (
    next_candidate.quality.playable_word_count !==
    current_best.quality.playable_word_count
  ) {
    return next_candidate.quality.playable_word_count >
      current_best.quality.playable_word_count
      ? next_candidate
      : current_best;
  }

  if (
    next_candidate.quality.vowel_class_count !==
    current_best.quality.vowel_class_count
  ) {
    return next_candidate.quality.vowel_class_count >
      current_best.quality.vowel_class_count
      ? next_candidate
      : current_best;
  }

  return current_best;
};
