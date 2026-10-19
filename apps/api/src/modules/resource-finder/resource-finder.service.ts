import { NotImplementedError } from "../../common/errors/app-error.js";

export const resourceFinderService = {
  async search(_params: Record<string, unknown>): Promise<unknown[]> {
    throw new NotImplementedError(
      "Resource finder search is not implemented in Sprint 1.",
    );
  },
};
