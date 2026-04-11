export type ProgressionTopology = "chapter_linear_v1";

export interface RuntimeProgressionDefinition {
  progression_version: string;
  topology: "chapter_linear_v1";
  starter_encounter_id: string;
  chapters: RuntimeProgressionChapterDefinition[];
}

export interface RuntimeProgressionChapterDefinition {
  chapter_id: string;
  display_name: string;
  habitat_theme_id: string;
  sort_index: number;
  encounter_ids: string[];
}
