import React from 'react'
import { Card } from '../../../components/ui/card.js'
import type { EmployeeSkill } from '../api/resources-api.js'

export interface ResourceSkillsCardProps {
  skills: EmployeeSkill[]
}

const MAX_LEVEL = 5

export const ResourceSkillsCard: React.FC<ResourceSkillsCardProps> = ({ skills }) => {
  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-ink">Skills &amp; proficiency</h2>

      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">
          No skills have been recorded for this resource yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3.5">
          {skills.map((skill) => {
            const level = Math.min(MAX_LEVEL, Math.max(1, skill.proficiencyLevel))

            return (
              <li key={skill.id} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-chip text-ink min-w-[96px]">
                  {skill.skillName}
                </span>

                <div
                  className="flex items-center gap-1.5"
                  role="img"
                  aria-label={`${skill.skillName}: level ${level} of ${MAX_LEVEL}`}
                >
                  {Array.from({ length: MAX_LEVEL }, (_, index) => (
                    <span
                      key={index}
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${
                        index < level ? 'bg-primary' : 'border border-primary bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
