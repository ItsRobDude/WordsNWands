export interface RuntimeValidationFinding {
  rule_id: string;
  severity: "error" | "warn" | "info";
}

export interface RuntimeValidationResult {
  ok: boolean;
  findings: RuntimeValidationFinding[];
  errors: Array<{
    code:
      | "schema_invalid"
      | "enum_invalid"
      | "countdown_invalid"
      | "matchup_invalid"
      | "damage_model_version_invalid"
      | "board_config_invalid"
      | "phase_rule_invalid"
      | "version_pin_mismatch"
      | "id_collision";
    message: string;
    field_path?: string;
  }>;
}
