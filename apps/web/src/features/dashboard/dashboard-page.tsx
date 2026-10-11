import React, { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'
import { Card } from '../../components/ui/card.js'
import { Input } from '../../components/ui/input.js'
import { Spinner } from '../../components/ui/spinner.js'

interface DashboardData { totalActiveResources: number; totalActiveProjects: number; fullyAvailableResources: number; fullyAllocatedResources: number; openStaffingRequirements: number; capacityDistribution: { fullyAvailable: number; partiallyAvailable: number; fullyAllocated: number } }
const today = (): string => new Date().toISOString().slice(0, 10)
const futureDate = (): string => { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10) }

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(futureDate)
  const [submitted, setSubmitted] = useState({ startDate, endDate })
  const query = useQuery({ queryKey: ['dashboard', submitted.startDate, submitted.endDate], queryFn: () => apiClient<{ data: DashboardData }>(`/dashboard?startDate=${submitted.startDate}&endDate=${submitted.endDate}`).then((result) => result.data) })
  const metrics = query.data ? [['Active resources', query.data.totalActiveResources, '/resources'], ['Active projects', query.data.totalActiveProjects, '/projects'], ['Fully available', query.data.fullyAvailableResources, '/resources'], ['Fully allocated', query.data.fullyAllocatedResources, '/allocations'], ['Open staffing requirements', query.data.openStaffingRequirements, '/projects']] : []
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-white">Workforce overview</h1><p className="mt-1 text-sm text-slate-400">Workforce and project staffing snapshot for {user?.role.replace('_', ' ').toLowerCase()}.</p></div><Badge variant="blue">{user?.role.replace('_', ' ')}</Badge></div>
    <form className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); if (startDate <= endDate) setSubmitted({ startDate, endDate }) }}><Input id="dashboard-start-date" label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><Input id="dashboard-end-date" label="End date" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} error={startDate > endDate ? 'End date must be on or after start date.' : undefined} /><Button id="dashboard-apply" type="submit" disabled={startDate > endDate}>Apply range</Button></form>
    {query.isLoading && <div className="flex min-h-48 items-center justify-center"><Spinner size="lg" /></div>}
    {query.isError && <Alert type="error" title="Overview unavailable">We could not load workforce metrics. <Button id="dashboard-retry" size="sm" variant="outline" className="ml-2" onClick={() => void query.refetch()}>Retry</Button></Alert>}
    {query.data && <><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{metrics.map(([label, value, route]) => <Link key={label as string} to={route as string}><Card className="h-full border-slate-800 bg-slate-900/60 p-5 transition hover:border-blue-500/50"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-3xl font-bold text-white">{value as number}</p></Card></Link>)}</section><Card className="border-slate-800 bg-slate-900/60 p-5"><h2 className="font-semibold text-white">Capacity distribution</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="text-sm text-slate-300">Available <strong className="text-white">{query.data.capacityDistribution.fullyAvailable}</strong></p><p className="text-sm text-slate-300">Partially available <strong className="text-white">{query.data.capacityDistribution.partiallyAvailable}</strong></p><p className="text-sm text-slate-300">Fully allocated <strong className="text-white">{query.data.capacityDistribution.fullyAllocated}</strong></p></div></Card></>}
  </div>
}
