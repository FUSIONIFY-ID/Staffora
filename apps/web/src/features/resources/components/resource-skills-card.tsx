import React from 'react'
import { Card } from '../../../components/ui/card.js'
import type { EmployeeSkill } from '../api/resources-api.js'
import { describeProficiency } from '../lib/resource-presentation.js'

export interface ResourceSkillsCardProps {
  skills: EmployeeSkill[]
}

const MAX_LEVEL = 5

// Level is shown as pips plus a numeric label, and the aria-label spells out the
// full value so screen readers do not get an unlabelled row of dots.
export const ResourceSkillsCard: React.FC<ResourceSkillsCardProps> = ({ skills }) => {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Skills &amp; proficiency</h2>
        <span className="text-xs text-slate-500">{skills.length} listed</span>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-slate-400">
          No skills have been recorded for this resource yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800/70">
          {skills.map((skill) => {
            const level = Math.min(MAX_LEVEL, Math.max(1, skill.proficiencyLevel))
            const label = describeProficiency(level)

            return (
              <li key={skill.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-slate-200">{skill.skillName}</span>

                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-1"
                    role="img"
                    aria-label={`${skill.skillName}: ${label}, level ${level} of ${MAX_LEVEL}`}
                  >
                    {Array.from({ length: MAX_LEVEL }, (_, index) => (
                      <span
                        key={index}
                        aria-hidden="true"
                        className={`h-2 w-6 rounded-full ${
                          index < level ? 'bg-blue-500' : 'bg-slate-700/70'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="w-28 text-right text-xs text-slate-400">
                    {label} · {level}/{MAX_LEVEL}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
