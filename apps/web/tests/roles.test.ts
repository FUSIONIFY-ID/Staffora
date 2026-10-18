import { describe, expect, it } from "vitest";
import { ROLE_LABELS, initialsOf } from "../src/app/roles.js";

describe("initialsOf", () => {
  it("takes one letter per word for a multi-word name", () => {
    // Design frame 02 shows "AI" for Arya Isnaidi.
    expect(initialsOf("Arya Isnaidi")).toBe("AI");
    expect(initialsOf("Chief Administrator")).toBe("CA");
    expect(initialsOf("Rian Pratama")).toBe("RP");
  });

  it("uses the first and last word when a name has more than two", () => {
    expect(initialsOf("Mochammad Fikri Chaerul Chalik Ramdhan")).toBe("MR");
  });

  it("takes two letters from a single-word name", () => {
    expect(initialsOf("Admin")).toBe("AD");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(initialsOf("  Arya   Isnaidi  ")).toBe("AI");
  });

  it("falls back to a placeholder when there is no letter to take", () => {
    expect(initialsOf("")).toBe("?");
    expect(initialsOf("   ")).toBe("?");
  });

  it("uppercases a lowercase name", () => {
    expect(initialsOf("arya isnaidi")).toBe("AI");
  });
});

describe("ROLE_LABELS", () => {
  it("names every role, so no screen can render a raw enum value", () => {
    expect(ROLE_LABELS).toEqual({
      ADMIN: "Admin",
      PROJECT_MANAGER: "Project Manager",
      RESOURCE_MANAGER: "Resource Manager",
      EMPLOYEE: "Employee",
    });
  });
});
