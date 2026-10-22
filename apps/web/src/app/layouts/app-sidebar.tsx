import React from "react";
import { NavLink } from "react-router";
import type { UserProfile } from "../providers/auth-provider.js";
import {
  visibleNavGroups,
  visiblePrimaryNav,
  NAV_GROUPS,
} from "../navigation/nav-config.js";
import { ROLE_LABELS, initialsOf } from "../roles.js";

export interface AppSidebarProps {
  user: UserProfile;
}

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive
      ? "bg-info-surface text-info-text font-semibold"
      : "text-ink-muted font-medium hover:text-ink hover:bg-surface-chip"
  }`;

const disabledLinkClass =
  "flex items-center px-3 py-2 rounded-lg text-sm text-ink-placeholder font-medium cursor-not-allowed select-none opacity-60";

const GROUP_HEADING =
  "px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-dim";

/**
 * Sidebar, per design frame 02.
 *
 * Shows navigation groups based on role. When the user is not an Employee,
 * "My Workspace" -> "My Profile" is shown as a disabled item so the feature is visible
 * in the sidebar matching the Figma design frame without enabling access for non-employees.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({ user }) => {
  const primary = visiblePrimaryNav(user.role);
  const groups = visibleNavGroups(user.role);
  const displayName = user.employee?.fullName || user.email;

  const showDisabledMyProfile = user.role !== "EMPLOYEE";
  const myWorkspaceGroup = NAV_GROUPS.find((g) => g.label === "My Workspace");

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col sticky top-0 h-screen border-r border-line bg-surface-white">
      <div className="h-[72px] shrink-0 flex flex-col justify-center px-5 border-b border-line">
        <span className="text-2xl font-semibold leading-tight text-ink">
          Staffora
        </span>
        <span className="text-[11px] leading-4 text-ink-dim">
          Right People. Right Project.
        </span>
      </div>

      <nav
        aria-label="Main"
        className="flex-1 overflow-y-auto px-3 py-5 space-y-6"
      >
        <div className="space-y-1">
          {primary.map((item) => (
            <NavLink key={item.path} to={item.path} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </div>

        {groups.map((group) => {
          return (
            <React.Fragment key={group.label}>
              <div
                role="group"
                aria-label={group.label}
                className="space-y-1"
              >
                <p className={GROUP_HEADING}>{group.label}</p>
                {group.items.map((item) => (
                  <NavLink key={item.path} to={item.path} className={linkClass}>
                    {item.label}
                  </NavLink>
                ))}
              </div>

              {/* In Figma frame 02, My Workspace sits right after Projects */}
              {group.label === "Projects" && showDisabledMyProfile && myWorkspaceGroup && (
                <div
                  role="group"
                  aria-label="My Workspace"
                  className="space-y-1"
                >
                  <p className={GROUP_HEADING}>My Workspace</p>
                  <span
                    className={disabledLinkClass}
                    title="Available for Employee role only"
                    aria-disabled="true"
                  >
                    My Profile
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-[10px] border border-line px-3 py-2">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-surface text-xs font-semibold text-info-text"
          >
            {initialsOf(displayName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold leading-[19px] text-ink-soft">
              {displayName}
            </span>
            <span className="block truncate text-[11px] leading-4 text-ink-dim">
              {ROLE_LABELS[user.role]}
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
};
