import React from 'react'
import { Card } from '../../../components/ui/card.js'
import { Badge } from '../../../components/ui/badge.js'
import type { ResourceSkillItem } from './types.js'

export interface ResourceSkillsCardProps {
  skills: ResourceSkillItem[]
}

const PROFICIENCY_LABELS: Record<number, { title: string; variant: 'blue' | 'green' | 'amber' | 'purple' | 'gray' }> = {
  1: { title: 'Level 1 - Beginner', variant: 'gray' },
  2: { title: 'Level 2 - Elementary', variant: 'blue' },
  3: { title: 'Level 3 - Intermediate', variant: 'green' },
  4: { title: 'Level 4 - Advanced', variant: 'purple' },
  5: { title: 'Level 5 - Expert', variant: 'amber' },
}

export const ResourceSkillsCard: React.FC<ResourceSkillsCardProps> = ({ skills }): React.JSX.Element => {
  return (
    <Card className="border-slate-800 bg-slate-900/60 p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Inventaris Keterampilan & Skill</h2>
          <p className="text-xs text-slate-400 mt-0.5">Daftar keahlian teknis dan tingkat kemahiran terverifikasi.</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {skills.length} Keterampilan
        </span>
      </div>

      {skills.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">
          Belum ada keterampilan yang ditambahkan untuk karyawan ini.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
            const config = PROFICIENCY_LABELS[skill.proficiencyLevel] ?? {
              title: `Level ${skill.proficiencyLevel}`,
              variant: 'blue',
            }

            return (
              <div
                key={skill.id || skill.skillId}
                className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-slate-700"
              >
                <div>
                  <h3 className="font-semibold text-white text-sm">{skill.skillName}</h3>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant={config.variant}>
                    {config.title}
                  </Badge>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <span
                        key={lvl}
                        className={`inline-block h-2 w-2 rounded-full ${
                          lvl <= skill.proficiencyLevel ? 'bg-blue-500' : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
