import type { EncounterRngStreamStates } from "../contracts/board.js";

const UINT32_RANGE = 0x1_0000_0000;

const hashStringToUint32 = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const parseStreamState = (
  state: string,
): { prefix: string; counter: number } => {
  const delimiter_index = state.lastIndexOf("::");
  if (delimiter_index === -1) {
    return { prefix: state, counter: 0 };
  }

  const suffix = state.slice(delimiter_index + 2);
  const parsed_counter = Number.parseInt(suffix, 10);
  if (Number.isNaN(parsed_counter) || parsed_counter < 0) {
    return { prefix: state, counter: 0 };
  }

  return {
    prefix: state.slice(0, delimiter_index),
    counter: parsed_counter,
  };
};

const formatStreamState = (prefix: string, counter: number): string =>
  `${prefix}::${counter}`;

export const drawUint32FromStreamState = (
  stream_state: string,
): { value: number; next_stream_state: string } => {
  const parsed = parseStreamState(stream_state);
  const value = hashStringToUint32(`${parsed.prefix}::${parsed.counter}`);

  return {
    value,
    next_stream_state: formatStreamState(parsed.prefix, parsed.counter + 1),
  };
};

export const pickLetterFromDraw = (
  draw_value: number,
  letter_pool: readonly string[],
): string => {
  const normalized_pool =
    letter_pool.length === 0
      ? ["A"]
      : [...new Set(letter_pool.map((letter) => letter.toUpperCase()))];
  const index = Math.floor(
    (draw_value / UINT32_RANGE) * normalized_pool.length,
  );
  return normalized_pool[Math.min(normalized_pool.length - 1, index)] ?? "A";
};

export const withAdvancedBoardFillStream = (
  rng_stream_states: EncounterRngStreamStates,
  next_stream_state: string,
): EncounterRngStreamStates => ({
  ...rng_stream_states,
  board_fill_stream_state: next_stream_state,
});
