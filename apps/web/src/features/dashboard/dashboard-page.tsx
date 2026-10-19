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
import { PageHeader } from '../../components/page-header.js'

interface DashboardData {
  totalActiveResources: number
  totalActiveProjects: number
  fullyAvailableResources: number
  fullyAllocatedResources: number
  openStaffingRequirements: number
  capacityDistribution: {
    fullyAvailable: number
    partiallyAvailable: number
    fullyAllocated: number
  }
}

const today = (): string => new Date().toISOString().slice(0, 10)
const futureDate = (): string => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 10)
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(futureDate)
  const [submitted, setSubmitted] = useState({ startDate, endDate })

  const query = useQuery({
    queryKey: ['dashboard', submitted.startDate, submitted.endDate],
    queryFn: async () => {
      const res = await apiClient<{ data: DashboardData }>(
        `/dashboard?startDate=${submitted.startDate}&endDate=${submitted.endDate}`,
      )
      return res.data
    },
  })

  const displayName = user?.employee?.fullName ?? user?.email ?? 'User'
  const roleText = user?.role ? user.role.replace('_', ' ') : 'USER'
  const metrics = query.data
    ? [
        ['Active resources', query.data.totalActiveResources, '/resources'],
        ['Active projects', query.data.totalActiveProjects, '/projects'],
        ['Fully available', query.data.fullyAvailableResources, '/resources'],
        ['Fully allocated', query.data.fullyAllocatedResources, '/allocations'],
        ['Open staffing requirements', query.data.openStaffingRequirements, '/projects'],
      ]
    : []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Selamat datang, ${displayName}`}
        description={`Workforce and project staffing snapshot for ${roleText.toLowerCase()}.`}
        actions={<Badge variant="purple">{roleText}</Badge>}
      />

      <form
        className="grid gap-3 rounded-xl border border-line bg-surface-white p-4 sm:grid-cols-3 items-end"
        onSubmit={(event) => {
          event.preventDefault()
          if (startDate <= endDate) setSubmitted({ startDate, endDate })
        }}
      >
        <Input
          id="dashboard-start-date"
          label="Start date"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <Input
          id="dashboard-end-date"
          label="End date"
          type="date"
          value={endDate}
          min={startDate}
          onChange={(event) => setEndDate(event.target.value)}
          error={startDate > endDate ? 'End date must be on or after start date.' : undefined}
        />
        <Button id="dashboard-apply" type="submit" disabled={startDate > endDate} className="w-full h-[42px]">
          Apply range
        </Button>
      </form>

      {query.isLoading && (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {query.isError && (
        <Alert type="error" title="Overview unavailable">
          We could not load workforce metrics.{' '}
          <Button id="dashboard-retry" size="sm" variant="outline" className="ml-2" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </Alert>
      )}

      {query.data && (
        <>
          <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {metrics.map(([label, value, route], idx) => (
              <Link
                key={label as string}
                to={route as string}
                className={idx === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}
              >
                <Card className="h-full p-5 transition hover:border-info-border">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">{label}</p>
                  <p className="mt-2 text-3xl font-bold text-ink">{value as number}</p>
                </Card>
              </Link>
            ))}
          </section>

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Capacity distribution</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <p className="text-sm text-ink-soft">
                Available <strong className="text-ink">{query.data.capacityDistribution.fullyAvailable}</strong>
              </p>
              <p className="text-sm text-ink-soft">
                Partially available <strong className="text-ink">{query.data.capacityDistribution.partiallyAvailable}</strong>
              </p>
              <p className="text-sm text-ink-soft">
                Fully allocated <strong className="text-ink">{query.data.capacityDistribution.fullyAllocated}</strong>
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
