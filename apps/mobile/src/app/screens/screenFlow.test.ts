import assert from "node:assert/strict";
import test from "node:test";

import {
  resolvePauseExitLabel,
  resolveResultScreenContent,
} from "./screenFlow.ts";

test("starter win keeps the primary CTA focused on entering chapter one", () => {
  const content = resolveResultScreenContent({
    active_state: {
      encounter_id: "enc_starter_001",
      creature: {
        display_name: "Puddle Puff",
        hp_current: 0,
      },
      session_state: "won",
    } as never,
    starter_encounter_id: "enc_starter_001",
    has_completed_starter_encounter: true,
  });

  assert.equal(content.primary_label, "Begin Chapter 1");
  assert.equal(content.secondary_label, "Return To Home");
});

test("starter loss keeps the secondary exit on the starter intro instead of normal home", () => {
  const content = resolveResultScreenContent({
    active_state: {
      encounter_id: "enc_starter_001",
      creature: {
        display_name: "Puddle Puff",
        hp_current: 4,
      },
      session_state: "lost",
    } as never,
    starter_encounter_id: "enc_starter_001",
    has_completed_starter_encounter: false,
  });

  assert.equal(content.primary_label, "Retry");
  assert.equal(content.secondary_label, "Return To Starter Intro");
});

test("recoverable-error flow keeps the dedicated retry encounter wording", () => {
  const content = resolveResultScreenContent({
    active_state: {
      encounter_id: "enc_meadow_001",
      creature: {
        display_name: "Storm Wisp",
        hp_current: 12,
      },
      session_state: "recoverable_error",
    } as never,
    starter_encounter_id: "enc_starter_001",
    has_completed_starter_encounter: true,
  });

  assert.equal(content.title, "Magic Board Hiccup");
  assert.equal(content.primary_label, "Retry Encounter");
  assert.equal(content.secondary_label, "Return To Home");
});

test("pause exit label respects the starter gate", () => {
  assert.equal(resolvePauseExitLabel(true), "Return To Home");
  assert.equal(resolvePauseExitLabel(false), "Return To Starter Intro");
});
