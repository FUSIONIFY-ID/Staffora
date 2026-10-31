import type { AuthenticatedUser } from "../../common/auth/types.js";
import {
  staffingRepository,
  type StaffingRequirementWithDetails,
  type StaffingRequirementWithSkills,
} from "./staffing.repository.js";
import { staffingPolicy } from "./staffing.policy.js";
import { skillsService } from "../skills/skills.service.js";
import {
  NotFoundError,
  NotImplementedError,
} from "../../common/errors/app-error.js";
import type {
  CreateStaffingRequirementInput,
  UpdateStaffingRequirementInput,
} from "./staffing.schema.js";

export const staffingService = {
  async getRequirementsForProject(
    projectId: string,
  ): Promise<StaffingRequirementWithDetails[]> {
    const project = await staffingRepository.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found.");
    }
    return staffingRepository.findByProjectId(projectId);
  },

  async createRequirement(
    projectId: string,
    data: CreateStaffingRequirementInput,
    user: AuthenticatedUser,
  ): Promise<StaffingRequirementWithSkills> {
    const project = await staffingRepository.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError("Project not found.");
    }
    staffingPolicy.assertCanManage(
      user,
      project.projectManagerEmployeeId,
      "Project not found.",
    );

    // AC01.05 / BR02: a deactivated skill cannot be newly attached to a
    // staffing requirement, exactly like a new employee assignment. Existence
    // and uniqueness are checked separately so an unknown or repeated id is a
    // 422 instead of a foreign-key 500.
    //
    // F8: these guards read the skills table before the insert and are not
    // covered by a lock on this path — the `FOR SHARE` primitive lives inside
    // the skills module and must not be reached across the module boundary.
    // The employee-assignment path closes the window with that lock; on the
    // staffing path it stays a narrow, documented gap until US03.02 owns a
    // shared transaction, so the check-then-insert here is not atomic.
    const requested = data.skills?.map((s) => s.skillId) ?? [];
    await skillsService.assertSkillReferencesValid(requested);
    await skillsService.assertSkillsActive(requested);

    return staffingRepository.create({
      projectId,
      jobRoleId: data.jobRoleId,
      headcount: data.headcount,
      allocationPercentage: data.allocationPercentage,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      skills: data.skills,
      createdBy: user.id,
    });
  },

  async updateRequirement(
    id: string,
    data: UpdateStaffingRequirementInput,
    user: AuthenticatedUser,
  ): Promise<StaffingRequirementWithSkills> {
    const requirement = await staffingRepository.findById(id);
    if (!requirement) {
      throw new NotFoundError("Staffing requirement not found.");
    }
    staffingPolicy.assertCanManage(
      user,
      requirement.project.projectManagerEmployeeId,
      "Staffing requirement not found.",
    );

    // AC01.05 / BR02: only skills that this request newly adds are checked for
    // active state. The update does replace every join row, but a skill that
    // was attached before it was deactivated must be able to stay attached —
    // otherwise a requirement holding a since-deactivated skill could never be
    // re-saved with its full list. Re-sending an unchanged attachment is not a
    // new assignment.
    const requested = data.skills?.map((s) => s.skillId) ?? [];
    await skillsService.assertSkillReferencesValid(requested);
    const existing = await staffingRepository.findSkillIdsByRequirementId(id);
    const newlyAdded = requested.filter(
      (skillId) => !existing.includes(skillId),
    );
    await skillsService.assertSkillsActive(newlyAdded);

    return staffingRepository.update(id, {
      jobRoleId: data.jobRoleId,
      headcount: data.headcount,
      allocationPercentage: data.allocationPercentage,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      skills: data.skills,
      updatedBy: user.id,
    });
  },

  async deleteRequirement(
    _id: string,
    _user: AuthenticatedUser,
  ): Promise<never> {
    throw new NotImplementedError(
      "Staffing requirement deletion is not implemented in Sprint 1.",
    );
  },
};
