export function renderReviewMarkdown(artifact) {
  const summary = artifact.review_summary;
  const findingsSummary = artifact.balance_report.validator_findings.length === 0
    ? 'No findings.'
    : artifact.balance_report.validator_findings
      .map((finding) => `[${finding.severity}] ${finding.code}: ${finding.message}`)
      .join(' | ');
  return [
    `# Encounter Draft Review: ${artifact.draft_id}`,
    '',
    `- **Draft ID:** ${artifact.draft_id}`,
    `- **Request ID:** ${artifact.request_id}`,
    `- **Generator version:** ${artifact.generator_version}`,
    `- **Blueprint used:** ${artifact.blueprint_id}`,
    `- **Habitat used:** ${summary.habitat_display_name} (${summary.habitat_theme_id})`,
    `- **Creature name:** ${summary.creature_display_name}`,
    `- **Weakness / resistance:** ${summary.weakness} / ${summary.resistance}`,
    `- **HP / move budget / countdown:** ${summary.max_hp} / ${summary.move_budget} / ${summary.base_countdown}`,
    `- **Spell summary:** ${summary.spell_identity}`,
    `- **Board profile ID:** ${artifact.encounter_definition.board_profile_id}`,
    `- **Expected pacing summary:** ${artifact.balance_report.derived_values.target_casts_to_defeat.toFixed(2)} casts target`,
    `- **Guardrail findings summary:** ${artifact.balance_report.guardrail_status} — ${findingsSummary}`,
    '',
    '## Why this should feel fair',
    summary.why_it_should_feel_fair,
    '',
    '## Why this matches Words \"n Wands!',
    summary.why_it_matches_wordsnwands,
    ''
  ].join('\n');
}
