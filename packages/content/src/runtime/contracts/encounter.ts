import type {
  DifficultyTier,
  ElementType,
  EncounterType,
  NonNeutralElementType,
} from "./core.js";

export interface RuntimeCreatureDefinition {
  id: string;
  encounterType: EncounterType;
  displayName: string;
  weakness: ElementType;
  resistance: ElementType;
  hp: number;
  baseSpellCountdown: number;
}

export interface RuntimeBoardConfig {
  width: number;
  height: number;
  board_profile_id: string;
}

export interface RuntimeEncounterBalanceMetadata {
  target_tier: DifficultyTier;
  target_fail_rate_band: "low" | "medium" | "high";
}

export interface RuntimeStarterTutorialScript {
  guidedFirstCast: {
    word: string;
    selectedPositions: Array<{ row: number; col: number }>;
    expectedElement: NonNeutralElementType;
  };
}

export interface RuntimeEncounterDefinition {
  id: string;
  creatureId: string;
  encounterType: EncounterType;
  difficultyTier: DifficultyTier;
  isStarterEncounter: boolean;
  validationSnapshotVersionPin: string;
  boardConfig: RuntimeBoardConfig;
  balanceMetadata: RuntimeEncounterBalanceMetadata;
  starterTutorialScript?: RuntimeStarterTutorialScript;
}
