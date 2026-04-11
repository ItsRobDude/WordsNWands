export interface RuntimeContentPackageManifest {
  package_id: string;
  content_version: string;
  validation_snapshot_version: string;
  battle_rules_version: string;
  board_generator_version: string;
  min_supported_app_version: string;
  schema_versions: {
    manifest_schema: string;
    creature_schema: string;
    encounter_schema: string;
    validation_snapshot_schema: string;
  };
  asset_pack_version: string | null;
  created_at_utc: string;
  created_by: string;
  status:
    | "draft"
    | "review_ready"
    | "fairness_reviewed"
    | "approved"
    | "bundled"
    | "published"
    | "archived"
    | "corrected_exception";
}
