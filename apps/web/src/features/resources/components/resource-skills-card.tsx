import React from 'react'
import type { ResourceSkillItem } from './types.js'

export interface ResourceSkillsCardProps {
  skills: ResourceSkillItem[]
}

const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Level 1 - Beginner',
  2: 'Level 2 - Elementary',
  3: 'Level 3 - Intermediate',
  4: 'Level 4 - Advanced',
  5: 'Level 5 - Expert',
}

export const ResourceSkillsCard: React.FC<ResourceSkillsCardProps> = ({ skills }): React.JSX.Element => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-6">Skills & proficiency</h2>

        {skills.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Belum ada keterampilan yang ditambahkan untuk karyawan ini.
          </div>
        ) : (
          <div className="space-y-4">
            {skills.map((skill) => {
              const level = Math.min(5, Math.max(1, skill.proficiencyLevel || 1))
              const label = PROFICIENCY_LABELS[level] ?? `Level ${level}`

              return (
                <div
                  key={skill.id || skill.skillId}
                  className="flex items-center justify-between gap-4"
                >
                  {/* Skill Pill */}
                  <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium min-w-[96px] text-center">
                    {skill.skillName}
                  </span>

                  {/* 5 Circular Dots Indicator matching Figma Design */}
                  <div className="flex items-center gap-1.5 shrink-0" title={label}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <span
                        key={lvl}
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          lvl <= level
                            ? 'bg-blue-600'
                            : 'border-2 border-blue-600 bg-transparent'
                        }`}
                      />
                    ))}
                    {/* Accessible text label for testing and screen readers */}
                    <span className="sr-only">{label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
