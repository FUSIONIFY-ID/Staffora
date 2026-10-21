import { skillsCatalogService } from "./skills.catalog.service.js";
import { skillsAssignmentService } from "./skills.assignment.service.js";

/**
 * Public surface of the skills module. Consumers (skills.controller.ts and
 * staffing.service.ts) import this object and never the internal services, so
 * the split into catalog and assignment halves stays an implementation detail.
 */
export const skillsService = {
  ...skillsCatalogService,
  ...skillsAssignmentService,
};
