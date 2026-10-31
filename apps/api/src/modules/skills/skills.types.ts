/**
 * Shapes owned by the skills module (PRD US02.02).
 *
 * The record interfaces are the projection the repository selects; the view
 * interfaces mirror the `Skill` and `EmployeeSkill` schemas in
 * docs/api/openapi.yaml. Keeping them separate means a column added to the
 * table never leaks into a response by accident.
 */

export interface SkillRecord {
  id: string;
  name: string;
  isActive: boolean;
}

export interface EmployeeSkillRecord {
  id: string;
  skillId: string;
  proficiencyLevel: number;
  skill: SkillRecord;
}

export interface SkillView {
  id: string;
  name: string;
  isActive: boolean;
}

export interface EmployeeSkillView {
  id: string;
  skillId: string;
  skillName: string;
  skillIsActive: boolean;
  proficiencyLevel: number;
}

export interface SkillListResult {
  data: SkillView[];
  total: number;
  page: number;
  pageSize: number;
}
