/**
 * @words-n-wands/game-rules
 *
 * Ownership boundary:
 * - Canonical encounter and battle state transitions belong here.
 * - Presentation layers should call APIs from this package rather than embedding
 *   gameplay truth directly in screen/view components.
 */
export * from "./contracts/index.js";

export * from "./damage/damageModelV1.js";

export * from "./board/createInitialBoard.js";
export * from "./board/createAuthoredBoard.js";
export * from "./board/collapseColumns.js";
export * from "./board/consumeTiles.js";
export * from "./board/refillBoard.js";
export * from "./board/applyBubbleRise.js";
export * from "./board/boardAcceptance.js";
export * from "./board/selectBestBoardCandidate.js";
export * from "./board/hasPlayableWord.js";
export * from "./board/tickSurvivingTileStates.js";

export * from "./encounter/createEncounterRuntimeState.js";
export * from "./encounter/validateCastSubmission.js";
export * from "./encounter/applyCastSubmission.js";
export * from "./encounter/applyCountdownStep.js";

export * from "./spells/applyTileStatePrimitive.js";
export * from "./spells/shiftRowPrimitive.js";
export * from "./spells/shiftColumnPrimitive.js";
export * from "./spells/applyCreatureSpell.js";

export * from "./recovery/runSparkShuffle.js";

export * from "./results/deriveEncounterOutcome.js";
export * from "./persistence/activeEncounterSnapshotAdapter.js";
export * from "./input/boardSelection.js";

export * from "./simulation/runEncounterHeadless.js";
export * from "./simulation/fixtures/headlessEncounterFixtures.js";
