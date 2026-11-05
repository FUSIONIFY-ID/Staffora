import type { ProjectStatus } from "../../generated/prisma/client.js";
import { ConflictError } from "../../common/errors/app-error.js";

/**
 * Allowed project status transitions (US03.01).
 * ASSUMPTION: no reopen (COMPLETED -> ACTIVE) and ARCHIVED is terminal.
 * Confirm against PRD US03.01 before merge.
 */
export const PROJECT_TRANSITIONS: Readonly<
  Record<ProjectStatus, readonly ProjectStatus[]>
> = {
  DRAFT: ["PLANNED", "ACTIVE"],
  PLANNED: ["DRAFT", "ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

/** Statuses a project may be created with. */
export const ALLOWED_CREATE_STATUSES: readonly ProjectStatus[] = [
  "DRAFT",
  "PLANNED",
  "ACTIVE",
];

/** Statuses that preserve history and block new allocations (BR-G13). */
export const CLOSED_PROJECT_STATUSES: readonly ProjectStatus[] = [
  "COMPLETED",
  "ARCHIVED",
];

/** Throws 409 INVALID_STATUS_TRANSITION when `from -> to` is not allowed. Same status is a no-op. */
export function assertTransition(from: ProjectStatus, to: ProjectStatus): void {
  if (from === to) return;
  if (!PROJECT_TRANSITIONS[from].includes(to)) {
    throw new ConflictError(
      `Project status cannot change from ${from} to ${to}.`,
      "INVALID_STATUS_TRANSITION",
      { from, to, allowed: PROJECT_TRANSITIONS[from] },
    );
  }
}

/** Throws 409 PROJECT_CLOSED when the project no longer accepts new allocations (BR-G13). */
export function assertProjectAcceptsAllocations(project: {
  id: string;
  status: ProjectStatus;
}): void {
  if (CLOSED_PROJECT_STATUSES.includes(project.status)) {
    throw new ConflictError(
      `Project is ${project.status} and does not accept new allocations.`,
      "PROJECT_CLOSED",
      { projectId: project.id, status: project.status },
    );
  }
}
