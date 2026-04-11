export interface RuntimeContentPackageSchemaVersions {
  manifest_schema: string;
  creature_schema: string;
  encounter_schema: string;
  progression_schema: string;
  validation_snapshot_schema: string;
}

export interface RuntimeContentPackagePayloadFiles {
  encounters: Record<string, string>;
  progression: Record<string, string>;
  validation: Record<string, string>;
}

export interface RuntimeContentPackageManifest {
  package_id: string;
  content_version: string;
  validation_snapshot_version: string;
  battle_rules_version: string;
  board_generator_version: string;
  progression_version: string;
  min_supported_app_version: string;
  schema_versions: RuntimeContentPackageSchemaVersions;
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
  payload_files: RuntimeContentPackagePayloadFiles;
}
