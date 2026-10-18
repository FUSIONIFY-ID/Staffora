# API Contract Changelog

Every change to `docs/api/openapi.yaml` that alters a response shape relative to
the contract already on `dev` is recorded here, with the acceptance criterion
that requires it. The PR #10 review asked for this: a contract change that no
documented requirement explains cannot be reviewed, and a consumer of the `dev`
contract cannot tell what broke.

**Status: proposed, awaiting Tech Lead approval.** The PRD is not in this
repository, so the AC references below cannot be verified from the repo alone.
The reviewer's other option was to delete every field no AC requires; those
deletions are recorded under _Removed before merge_.

Compared against `dev` at `c07cca3`, implemented on
`BE-S1-US02-employee-resource-api`.

## `Employee`

### Added

| Field          | Type                                                                | Basis                                                                                                                                                         | Needs approval       |
| -------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `availability` | enum `AVAILABLE` / `PARTIAL` / `FULLY_ALLOCATED` / `NOT_ASSIGNABLE` | PRD US02.01 - AC01.03 requires a current availability indicator on each directory row. `NOT_ASSIGNABLE` for inactive employees also serves US05.01 - AC03.04. | yes — confirm the AC |

### Required set

Unchanged from `dev`, plus `availability`:
`[id, employeeCode, fullName, workEmail, departmentId, jobRoleId, status, availability]`.

`departmentName`, `jobRoleTitle`, `currentAllocation`, and `currentRemainingCapacity`
stay optional properties exactly as on `dev`, even though the API always returns
them. Keeping the `dev` list means a consumer of the published contract sees one
addition instead of several newly mandatory fields.

## `EmployeeDetail`

### Added

| Field             | Type                                                                            | Basis                                                                                                                                                                            | Needs approval       |
| ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `evaluatedPeriod` | object: `startDate`, `endDate`, `peakConcurrentAllocation`, `remainingCapacity` | PRD US02.01 - AC04.04 requires peak concurrent allocation and remaining capacity for a selected date range. The shape matches the object already declared in the `dev` contract. | yes — confirm the AC |

`evaluatedPeriod` was declared but not marked `required` on `dev`. It stays an
optional property in the parent schema for the same reason as the fields above:
the route always evaluates the window and always returns the object, but the
published contract keeps the `dev` list so no field becomes newly mandatory
without Tech Lead sign-off. Its own members (`startDate`, `endDate`,
`peakConcurrentAllocation`, `remainingCapacity`) are `required` inside the
object, because a partially filled window would be unusable.

## `EmployeeSkill`

### Added

| Field           | Type    | Basis                                                                                                                                                   | Needs approval                               |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `skillIsActive` | boolean | The detail response already joins the skill row, and a retired skill has to be distinguishable from a current one without a second call to the catalog. | yes — no AC reference available in this repo |

## Responses

`403`, `409`, and `422` are now declared on the workforce operations. The code
already returned them; the contract did not say so, which left generated clients
unable to see the failure modes.

## Removed before merge

These appeared in an intermediate revision of this branch and were removed
during review round 3, because no acceptance criterion required them:

| Field                                                                | Why it was removed                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capacitySummary`, with `activeAllocation` and `hasCapacityConflict` | `activeAllocation` summed allocations that overlap a window, which adds sequential work as if it were concurrent and violates TSD 10.3 / BR-G17. `hasCapacityConflict` restated `remainingCapacity`. The window figures are reported once, in `evaluatedPeriod`. |
| `Employee.createdAt`, `Employee.updatedAt`                           | Not on the `dev` contract and not required by any AC on this card. No consumer in either application.                                                                                                                                                            |
| `EmployeeDetail.department`, `EmployeeDetail.jobRole`                | Repeated `departmentId` / `departmentName` and `jobRoleId` / `jobRoleTitle`, which the row already carries.                                                                                                                                                      |
| `EmployeeAllocation` schema                                          | `EmployeeDetail.allocations` uses the `Allocation` schema from `dev`, so this second schema had no referent.                                                                                                                                                     |

## How to check this document

```bash
git diff origin/dev -- docs/api/openapi.yaml
```

Each hunk should correspond to a row above. `apps/web/src/api/schema.d.ts` is
regenerated from the same file with `npm run api:types`.
