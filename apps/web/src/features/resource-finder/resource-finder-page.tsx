import React, { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'
import { Card } from '../../components/ui/card.js'
import { Input } from '../../components/ui/input.js'
import { Spinner } from '../../components/ui/spinner.js'

interface FinderItem { employeeId: string; fullName: string; employeeCode?: string; jobRoleTitle?: string; departmentName?: string; peakAllocation?: number; remainingCapacity?: number; isAssignable?: boolean; skills?: { name: string; proficiency?: string }[] }
interface FinderFilters { startDate: string; endDate: string; minRemainingCapacity: string }
const today = (): string => new Date().toISOString().slice(0, 10)
const futureDate = (): string => { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10) }

export const ResourceFinderPage: React.FC = () => {
  const [filters, setFilters] = useState<FinderFilters>({ startDate: today(), endDate: futureDate(), minRemainingCapacity: '' })
  const [submitted, setSubmitted] = useState<FinderFilters | null>(null)
  const query = useQuery({
    queryKey: ['resource-finder', submitted],
    enabled: submitted !== null,
    queryFn: () => {
      if (!submitted) return Promise.resolve([] as FinderItem[])
      const params = new URLSearchParams({ startDate: submitted.startDate, endDate: submitted.endDate })
      if (submitted.minRemainingCapacity) params.set('minRemainingCapacity', submitted.minRemainingCapacity)
      return apiClient<{ data: FinderItem[] }>(`/resource-finder?${params.toString()}`).then((result) => result.data)
    },
  })
  const invalidRange = filters.startDate > filters.endDate
  return <div className="space-y-6"><div className="border-b border-slate-800 pb-6"><h1 className="text-2xl font-bold text-white">Find resources</h1><p className="mt-1 text-sm text-slate-400">Find assignable people by an inclusive date range and minimum available capacity.</p></div><form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 items-end" onSubmit={(event) => { event.preventDefault(); if (!invalidRange) setSubmitted(filters) }}><Input id="finder-start-date" label="Start date" type="date" value={filters.startDate} onChange={(event) => setFilters({ ...filters, startDate: event.target.value })} /><Input id="finder-end-date" label="End date" type="date" value={filters.endDate} min={filters.startDate} onChange={(event) => setFilters({ ...filters, endDate: event.target.value })} error={invalidRange ? 'End date must be on or after start date.' : undefined} /><Input id="finder-min-capacity" label="Minimum capacity" type="number" min="0" max="100" placeholder="0–100" value={filters.minRemainingCapacity} onChange={(event) => setFilters({ ...filters, minRemainingCapacity: event.target.value })} /><Button id="finder-search" type="submit" disabled={invalidRange} className="w-full h-[42px]">Find resources</Button></form>{submitted === null && <Alert type="info" title="Choose a date range">Search begins only after you submit valid dates.</Alert>}{query.isLoading && <div className="flex min-h-40 items-center justify-center"><Spinner size="lg" /></div>}{query.isError && <Alert type="error" title="Search unavailable">We could not find resources right now. <Button id="finder-retry" size="sm" variant="outline" className="ml-2" onClick={() => void query.refetch()}>Retry</Button></Alert>}{query.data && <section className="space-y-3">{query.data.length === 0 ? <Card className="border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">No resources match this range and capacity requirement.</Card> : query.data.map((resource) => <Card key={resource.employeeId} className="flex flex-col gap-4 border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">{resource.fullName}</h2><p className="mt-1 text-sm text-slate-400">{resource.jobRoleTitle ?? 'Role not provided'} · {resource.departmentName ?? 'Department not provided'}</p><div className="mt-3 flex flex-wrap gap-2">{resource.skills?.map((skill) => <Badge key={skill.name} variant="blue">{skill.name}{skill.proficiency ? ` · ${skill.proficiency}` : ''}</Badge>)}</div></div><div className="flex items-center gap-4"><div className="text-right text-sm"><p className="text-slate-400">Remaining capacity</p><strong className="text-lg text-white">{resource.remainingCapacity ?? 0}%</strong></div><Link to={`/resources/${resource.employeeId}`}><Button id={`finder-result-${resource.employeeId}`} variant="outline">View profile</Button></Link></div></Card>)}</section>}</div>
}
