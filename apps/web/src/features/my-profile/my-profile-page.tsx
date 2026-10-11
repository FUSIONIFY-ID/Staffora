import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'
import { Card } from '../../components/ui/card.js'
import { Spinner } from '../../components/ui/spinner.js'

interface ProfileData { profile: { id: string; fullName: string; workEmail: string; departmentName?: string; jobRoleTitle?: string; status?: string }; skills: { id?: string; name?: string; skillName?: string; proficiency?: string }[]; currentAllocations: Allocation[]; plannedAllocations: Allocation[]; currentTotalAllocation: number; remainingCapacity: number }
interface Allocation { id?: string; projectName?: string; allocationPercentage?: number; startDate?: string; endDate?: string }

const AllocationList: React.FC<{ title: string; items: Allocation[] }> = ({ title, items }) => <Card className="border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold text-white">{title}</h2>{items.length === 0 ? <p className="mt-3 text-sm text-slate-400">No allocations in this period.</p> : <ul className="mt-3 space-y-2">{items.map((item, index) => <li key={item.id ?? `${title}-${index}`} className="flex justify-between text-sm text-slate-300"><span>{item.projectName ?? 'Project allocation'}</span><strong className="text-white">{item.allocationPercentage ?? 0}%</strong></li>)}</ul>}</Card>

export const MyProfilePage: React.FC = () => {
  const query = useQuery({ queryKey: ['my-profile'], queryFn: () => apiClient<{ data: ProfileData }>('/me').then((result) => result.data) })
  if (query.isLoading) return <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" /></div>
  if (query.isError) return <Alert type="error" title="Profile unavailable">We could not load your profile. <Button id="profile-retry" size="sm" variant="outline" className="ml-2" onClick={() => void query.refetch()}>Retry</Button></Alert>
  if (!query.data) return <Alert type="warning" title="Profile unavailable">Your profile did not return any data.</Alert>
  const data = query.data
  return <div className="space-y-6"><div className="border-b border-slate-800 pb-6"><h1 className="text-2xl font-bold text-white">My profile</h1><p className="mt-1 text-sm text-slate-400">Your profile, skills, allocations, and current capacity.</p></div><section className="grid gap-4 lg:grid-cols-3"><Card className="border-slate-800 bg-slate-900/60 p-6 lg:col-span-2"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-white">{data.profile.fullName}</h2><p className="mt-1 text-sm text-slate-400">{data.profile.workEmail}</p></div><Badge variant="green">{data.profile.status ?? 'ACTIVE'}</Badge></div><dl className="mt-6 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Department</dt><dd className="mt-1 text-sm text-slate-200">{data.profile.departmentName ?? 'Not provided'}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job role</dt><dd className="mt-1 text-sm text-slate-200">{data.profile.jobRoleTitle ?? 'Not provided'}</dd></div></dl></Card><Card className="border-slate-800 bg-slate-900/60 p-6"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining capacity</p><p className="mt-2 text-4xl font-bold text-white">{data.remainingCapacity}%</p><p className="mt-2 text-sm text-slate-400">Currently allocated: {data.currentTotalAllocation}%</p></Card></section><Card className="border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold text-white">Skills</h2>{data.skills.length === 0 ? <p className="mt-3 text-sm text-slate-400">No skills have been recorded yet.</p> : <div className="mt-3 flex flex-wrap gap-2">{data.skills.map((skill, index) => <Badge key={skill.id ?? index} variant="blue">{skill.name ?? skill.skillName ?? 'Skill'}{skill.proficiency ? ` · ${skill.proficiency}` : ''}</Badge>)}</div>}</Card><section className="grid gap-4 lg:grid-cols-2"><AllocationList title="Current allocations" items={data.currentAllocations} /><AllocationList title="Planned allocations" items={data.plannedAllocations} /></section></div>
}
