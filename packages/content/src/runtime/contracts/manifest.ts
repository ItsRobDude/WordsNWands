export interface RuntimeContentPackageManifest {
  manifest_id: string;
  content_version: string;
  validation_snapshot_version: string;
  battle_rules_version: string;
  board_generator_version: string;
  progression_version: string;
  encounter_ids: string[];
  creature_ids: string[];
  published_at_utc: string;
}
