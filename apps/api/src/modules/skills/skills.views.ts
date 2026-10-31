import type {
  EmployeeSkillRecord,
  EmployeeSkillView,
  SkillRecord,
  SkillView,
} from "./skills.types.js";

/** Maps a `skills` row onto the `Skill` schema in docs/api/openapi.yaml. */
export function toSkillView(skill: SkillRecord): SkillView {
  return {
    id: skill.id,
    name: skill.name,
    isActive: skill.isActive,
  };
}

/**
 * Maps an `employee_skills` row onto the `EmployeeSkill` schema.
 *
 * `skillIsActive` is reported from the referenced skill rather than filtered
 * out, so an assignment to a since-deactivated skill stays readable and is
 * visibly flagged (BR03, AC01.04).
 */
export function toEmployeeSkillView(
  entry: EmployeeSkillRecord,
): EmployeeSkillView {
  return {
    id: entry.id,
    skillId: entry.skillId,
    skillName: entry.skill.name,
    skillIsActive: entry.skill.isActive,
    proficiencyLevel: entry.proficiencyLevel,
  };
}
