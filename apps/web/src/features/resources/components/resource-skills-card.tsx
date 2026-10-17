import React from 'react'
import { Card } from '../../../components/ui/card.js'
import { Badge } from '../../../components/ui/badge.js'
import type { ResourceSkillItem } from './types.js'

export interface ResourceSkillsCardProps {
  skills: ResourceSkillItem[]
}

const PROFICIENCY_LABELS: Record<
  number,
  { title: string; variant: 'blue' | 'green' | 'amber' | 'purple' | 'gray'; barColor: string }
> = {
  1: { title: 'Level 1 - Beginner', variant: 'gray', barColor: 'bg-slate-400' },
  2: { title: 'Level 2 - Elementary', variant: 'blue', barColor: 'bg-blue-400' },
  3: { title: 'Level 3 - Intermediate', variant: 'green', barColor: 'bg-emerald-400' },
  4: { title: 'Level 4 - Advanced', variant: 'purple', barColor: 'bg-purple-400' },
  5: { title: 'Level 5 - Expert', variant: 'amber', barColor: 'bg-amber-400' },
}

export const ResourceSkillsCard: React.FC<ResourceSkillsCardProps> = ({ skills }): React.JSX.Element => {
  return (
    <Card className="border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Inventaris Keterampilan & Skill</h2>
          <p className="text-xs text-slate-400 mt-0.5">Daftar keahlian teknis dan tingkat kemahiran terverifikasi (Skala 1 - 5).</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
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
              barColor: 'bg-blue-400',
            }

            return (
              <div
                key={skill.id || skill.skillId}
                className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-blue-900/10"
              >
                <div>
                  <h3 className="font-semibold text-white text-sm tracking-tight">{skill.skillName}</h3>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={config.variant} className="text-[11px] font-medium">
                      {config.title}
                    </Badge>
                    <span className="font-mono text-xs text-slate-400">
                      {skill.proficiencyLevel}/5
                    </span>
                  </div>

                  {/* 5-Segmented Proficiency Visual Meter */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1.5 rounded-full transition-all ${
                          lvl <= skill.proficiencyLevel
                            ? config.barColor
                            : 'bg-slate-800'
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

