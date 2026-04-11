import type {
  EncounterRngStreamStates,
  EncounterRuntimeState,
} from "../contracts/board.js";
import type { ActiveEncounterSnapshotRecord } from "../contracts/persistence.js";

export interface SerializeActiveEncounterSnapshotOptions {
  active_assist_state_json?: ActiveEncounterSnapshotRecord["active_assist_state_json"];
  last_persisted_at_utc?: string;
}

export interface ActiveEncounterSnapshotPayload extends ActiveEncounterSnapshotRecord {
  rng_stream_states: EncounterRngStreamStates;
}

export type RestoreEncounterRuntimeStatePayload = Pick<
  ActiveEncounterSnapshotRecord,
  | "runtime_state_json"
  | "session_state"
  | "terminal_reason_code"
  | "last_persisted_at_utc"
> & {
  rng_stream_states?: EncounterRngStreamStates;
};

export const serializeActiveEncounterSnapshot = (
  state: EncounterRuntimeState,
  options: SerializeActiveEncounterSnapshotOptions = {},
): ActiveEncounterSnapshotPayload => ({
  encounter_session_id: state.encounter_session_id,
  encounter_id: state.encounter_id,
  encounter_type: state.creature.encounter_type,
  session_state: state.session_state,
  terminal_reason_code: state.terminal_reason_code,
  runtime_state_json: JSON.stringify(state),
  active_assist_state_json: options.active_assist_state_json ?? null,
  last_persisted_at_utc: options.last_persisted_at_utc ?? state.updated_at_utc,
  rng_stream_states: structuredClone(state.board.rng_stream_states),
});

export const restoreEncounterRuntimeState = (
  payload: RestoreEncounterRuntimeStatePayload,
): EncounterRuntimeState => {
  const runtime_state = JSON.parse(
    payload.runtime_state_json,
  ) as EncounterRuntimeState;

  return {
    ...runtime_state,
    session_state: payload.session_state,
    terminal_reason_code: payload.terminal_reason_code,
    updated_at_utc: payload.last_persisted_at_utc,
    board: {
      ...runtime_state.board,
      rng_stream_states:
        payload.rng_stream_states ?? runtime_state.board.rng_stream_states,
    },
  };
};
