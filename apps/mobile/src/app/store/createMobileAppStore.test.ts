import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { serializeActiveEncounterSnapshot } from "../../../../../packages/game-rules/src/index.ts";
import { createBundledContentRuntime } from "../../../../../packages/content/src/runtime/createBundledContentRuntime.ts";
import type { RuntimeContentPackageManifest } from "../../../../../packages/content/src/runtime/contracts/manifest.ts";
import type { RuntimeProgressionDefinition } from "../../../../../packages/content/src/runtime/contracts/progression.ts";
import type { RuntimeValidationSnapshot } from "../../../../../packages/validation/src/contracts/types.js";
import { createInMemoryAppPersistence } from "../persistence/createInMemoryAppPersistence.ts";
import { createMobileAppStore } from "./createMobileAppStore.ts";
import { createFreshEncounterRuntime } from "../../verticalSlice/encounterRuntime.ts";

const STARTER_GUIDED_PATH = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 0, col: 3 },
] as const;

const STARTER_TRACE_BOUNDS = {
  board_left_px: 0,
  board_top_px: 0,
  board_width_px: 600,
  board_height_px: 600,
  rows: 6,
  cols: 6,
} as const;

test("initialize routes a fresh player into starter flow", async () => {
  const persistence = createInMemoryAppPersistence();
  const content = loadBundledContentRuntime();
  const store = createMobileAppStore({ persistence, content });

  await store.getState().actions.initialize();

  assert.equal(
    store.getState().sessionSlice.app_primary_surface,
    "starter_flow",
  );
  assert.equal(store.getState().encounterSlice.runtime_state, null);
});

test("launch and submit starter selection persists an active snapshot", async () => {
  const persistence = createInMemoryAppPersistence();
  const content = loadBundledContentRuntime();
  const store = createMobileAppStore({ persistence, content });

  await store.getState().actions.initialize();
  await store.getState().actions.launchEncounter("enc_starter_001");

  for (const position of STARTER_GUIDED_PATH) {
    store.getState().actions.selectBoardPosition(position);
  }

  await store.getState().actions.submitSelection();

  const state = store.getState();
  assert.equal(
    state.mobileSlice.last_transcript_entry?.cast_resolution.submission_kind,
    "valid",
  );
  assert.equal(state.uiSlice.highlighted_word_preview, "");
  assert.deepEqual(state.uiSlice.swipe_preview_path, []);

  const persisted = await persistence.loadBootstrapState();
  assert.equal(persisted.active_snapshot?.encounter_id, "enc_starter_001");
});

test("trace selection commits through the same shared submission pipeline", async () => {
  const persistence = createInMemoryAppPersistence();
  const content = loadBundledContentRuntime();
  const store = createMobileAppStore({ persistence, content });

  await store.getState().actions.initialize();
  await store.getState().actions.launchEncounter("enc_starter_001");

  await store.getState().actions.applyTraceSelection(
    {
      trace_id: "trace-starter-001",
      phase: "start",
      samples: [{ pointer_id: 7, x_px: 20, y_px: 20, t_ms: 1 }],
    },
    STARTER_TRACE_BOUNDS,
  );
  await store.getState().actions.applyTraceSelection(
    {
      trace_id: "trace-starter-001",
      phase: "move",
      samples: [
        { pointer_id: 7, x_px: 120, y_px: 20, t_ms: 2 },
        { pointer_id: 7, x_px: 220, y_px: 20, t_ms: 3 },
      ],
    },
    STARTER_TRACE_BOUNDS,
  );
  await store.getState().actions.applyTraceSelection(
    {
      trace_id: "trace-starter-001",
      phase: "end",
      samples: [{ pointer_id: 7, x_px: 320, y_px: 20, t_ms: 4 }],
    },
    STARTER_TRACE_BOUNDS,
  );

  const state = store.getState();
  assert.equal(
    state.mobileSlice.last_transcript_entry?.cast_resolution.submission_kind,
    "valid",
  );
  assert.deepEqual(state.uiSlice.swipe_preview_path, []);
  assert.equal(state.uiSlice.highlighted_word_preview, "");
  assert.equal(state.encounterSlice.runtime_state?.casts_resolved_count, 1);
});

test("initialize restores an unresolved active encounter snapshot", async () => {
  const content = loadBundledContentRuntime();
  const created = createFreshEncounterRuntime({
    content,
    encounter_id: "enc_starter_001",
    attempt_number: 1,
  });
  const persistence = createInMemoryAppPersistence({
    active_snapshot: serializeActiveEncounterSnapshot(created.runtime_state),
  });
  const store = createMobileAppStore({ persistence, content });

  await store.getState().actions.initialize();

  assert.equal(store.getState().sessionSlice.app_primary_surface, "encounter");
  assert.equal(
    store.getState().encounterSlice.runtime_state?.encounter_id,
    "enc_starter_001",
  );
});

test("initialize restores a terminal snapshot to the result surface", async () => {
  const content = loadBundledContentRuntime();
  const created = createFreshEncounterRuntime({
    content,
    encounter_id: "enc_starter_001",
    attempt_number: 1,
  });
  const terminal_state = {
    ...created.runtime_state,
    session_state: "won" as const,
    terminal_reason_code: "normal_win" as const,
  };
  const persistence = createInMemoryAppPersistence({
    active_snapshot: serializeActiveEncounterSnapshot(terminal_state),
  });
  const store = createMobileAppStore({ persistence, content });

  await store.getState().actions.initialize();

  assert.equal(store.getState().sessionSlice.app_primary_surface, "result");
  assert.equal(store.getState().uiSlice.result_ack_pending, 1);
});

function loadBundledContentRuntime() {
  const bundleRoot = path.resolve(
    process.cwd(),
    "../../content/packages/content_m2_launch_v1",
  );

  return createBundledContentRuntime({
    manifest: readJsonFile(
      path.join(bundleRoot, "manifest.json"),
    ) as RuntimeContentPackageManifest,
    progression: readJsonFile(
      path.join(
        bundleRoot,
        "progression/progression.progression_m2_chapter_linear_v1.json",
      ),
    ) as RuntimeProgressionDefinition,
    validation_snapshot: readJsonFile(
      path.join(
        bundleRoot,
        "validation/snapshot.val_snapshot_m2_launch_v1.json",
      ),
    ) as RuntimeValidationSnapshot,
    encounters: [
      readJsonFile(path.join(bundleRoot, "encounters/enc_starter_001.json")),
      readJsonFile(path.join(bundleRoot, "encounters/enc_meadow_001.json")),
    ],
  });
}

function readJsonFile(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
