import type {
  DifficultyTier,
  EncounterType,
  NonNeutralElementType,
  StarPolicyVersion,
  TileStateKind,
} from "./core.js";

export type CreatureSpellPrimitive =
  | ApplyTileStatePrimitive
  | ShiftRowPrimitive
  | ShiftColumnPrimitive
  | ChainedSpellPrimitive;

export interface ApplyTileStatePrimitive {
  kind: "apply_tile_state";
  tile_state: TileStateKind;
  target_count: number;
  targeting: "random_eligible" | "authored_pattern";
}

export interface ShiftRowPrimitive {
  kind: "shift_row";
  row_index: number;
  mode: "rotate";
  distance: 1;
  direction: 1 | -1;
}

export interface ShiftColumnPrimitive {
  kind: "shift_column";
  col_index: number;
  mode: "rotate";
  distance: 1;
  direction: 1 | -1;
}

export interface ChainedSpellPrimitive {
  kind: "chained";
  steps: Array<
    ApplyTileStatePrimitive | ShiftRowPrimitive | ShiftColumnPrimitive
  >;
}

export interface RuntimePhaseRule {
  trigger:
    | { kind: "hp_threshold"; thresholdPercent: number }
    | { kind: "countdown_cycle"; cycleCount: number };
  changesWeaknessTo: NonNeutralElementType | null;
  changesResistanceTo: NonNeutralElementType | null;
  nextPhaseState: "phase_two" | "special";
}

export interface RuntimeCreatureDefinition {
  id: string;
  displayName: string;
  encounterType: EncounterType;
  difficultyTier: DifficultyTier;
  maxHp: number;
  weakness: NonNeutralElementType;
  resistance: NonNeutralElementType;
  baseCountdown: number;
  spellIdentity: string;
  spellPrimitives: CreatureSpellPrimitive[];
  phaseRules: RuntimePhaseRule[];
  contentVersion: string;
}

export interface RuntimeLetterWeightEntry {
  letter: string;
  weight: number;
}

export interface RuntimeBoardQualityPolicy {
  qualityPolicyVersion: string;
  minVowelClassCount: number;
}

export interface RuntimeBoardConfig {
  rows: 6;
  cols: 6;
  seedMode: "generated" | "fixed_seed";
  fixedSeed: string | null;
  allowWandTiles: boolean;
  wandSpawnRate: number;
  maxConcurrentWands: number | null;
  letterDistributionProfileId: string;
  letterWeightEntries: RuntimeLetterWeightEntry[];
  namedLetterPoolId: string | null;
  vowelClassProfileVersion: string;
  vowelClassIncludesY: boolean;
  boardQualityPolicy: RuntimeBoardQualityPolicy | null;
}

export interface RuntimeEncounterBalanceWaiver {
  waiverId: string;
  ruleId: string;
  reason: string;
  approver: string;
  reviewByUtc: string;
}

export interface RuntimeEncounterBalanceMetadata {
  authoredFailRateBand: "low" | "medium" | "high";
  shippabilityStatus:
    | "prototype"
    | "tune-required"
    | "candidate-shippable"
    | "shippable";
  waivers: RuntimeEncounterBalanceWaiver[];
}

export interface RuntimeStarterTutorialScript {
  guidedFirstCast: {
    normalizedWord: string;
    selectedPositions: Array<{ row: number; col: number }>;
    expectedElement: NonNeutralElementType;
  };
  starterBoardOpening: {
    openingBoardSource: {
      mode: "authored_board" | "authored_seed";
      authoredBoard?: string[][];
      authoredSeed?: string;
    };
    guaranteedGuidedFirstCastPath: Array<{ row: number; col: number }>;
    postFirstSpellWeaknessTeachingTarget: {
      normalizedWord: string;
      expectedElement: NonNeutralElementType;
      availabilityRule: "required_immediately_after_first_creature_spell";
    };
    transitionToOrdinaryFlow: {
      trigger: "after_guided_first_cast_and_first_creature_spell";
      continueWithStandardEncounterRules: true;
    };
  };
  weaknessTeachingWord: string;
  mustShowCreatureSpellBeforeWin: boolean;
}

export interface RuntimeRewardDefinition {
  grantsProgressUnlock: 0 | 1;
  grantsJournalProgress: 0 | 1;
  grantsCosmeticCurrency: number;
}

export interface HiddenBonusWordPolicy {
  selectionSource: "themed_lexicon_subset";
  deterministicSelection: "encounter_seed_bound";
  maxClaimsPerEncounter: 1;
  grantsMetaRewardOnly: 1;
}

export interface RuntimeEncounterDefinition {
  id: string;
  creatureId: string;
  moveBudget: number;
  starPolicyVersion: StarPolicyVersion;
  isStarterEncounter: boolean;
  starterTutorialScript: RuntimeStarterTutorialScript | null;
  introFlavorText: string | null;
  damageModelVersion: "damage_model_v1";
  rewardDefinition: RuntimeRewardDefinition | null;
  hiddenBonusWordPolicy: HiddenBonusWordPolicy | null;
  boardConfig: RuntimeBoardConfig;
  balanceMetadata: RuntimeEncounterBalanceMetadata;
  contentVersion: string;
}
