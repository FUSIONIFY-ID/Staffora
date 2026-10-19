import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
import { Button } from '../../components/ui/button.js'
import { Card } from '../../components/ui/card.js'
import { PageHeader } from '../../components/page-header.js'
import { Spinner } from '../../components/ui/spinner.js'

interface ProfileData {
  profile: {
    id: string
    fullName: string
    workEmail: string
    departmentName?: string
    jobRoleTitle?: string
    status?: string
  }
  skills: { id?: string; name?: string; skillName?: string; proficiency?: string }[]
  currentAllocations: Allocation[]
  plannedAllocations: Allocation[]
  currentTotalAllocation: number
  remainingCapacity: number
}

interface Allocation {
  id?: string
  projectName?: string
  allocationPercentage?: number
  startDate?: string
  endDate?: string
}

const AllocationList: React.FC<{ title: string; items: Allocation[] }> = ({ title, items }) => (
  <Card className="p-5">
    <h2 className="font-semibold text-ink">{title}</h2>
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-ink-muted">No allocations in this period.</p>
    ) : (
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item.id ?? `${title}-${index}`} className="flex justify-between text-sm text-ink-soft">
            <span>{item.projectName ?? 'Project allocation'}</span>
            <strong className="text-ink">{item.allocationPercentage ?? 0}%</strong>
          </li>
        ))}
      </ul>
    )}
  </Card>
)

export const MyProfilePage: React.FC = () => {
  const query = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient<{ data: ProfileData }>('/me').then((result) => result.data),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your profile, skills, allocations, and current capacity."
      />

      {query.isLoading && (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {query.isError && (
        <Alert type="error" title="Profile unavailable">
          We could not load your profile.{' '}
          <Button id="profile-retry" size="sm" variant="outline" className="ml-2" onClick={() => void query.refetch()}>
            Retry
          </Button>
        </Alert>
      )}

      {!query.isLoading && !query.isError && !query.data && (
        <Alert type="warning" title="Profile unavailable">
          Your profile did not return any data.
        </Alert>
      )}

      {query.data && (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink">{query.data.profile.fullName}</h2>
                  <p className="mt-1 text-sm text-ink-muted">{query.data.profile.workEmail}</p>
                </div>
                <Badge variant="green">{query.data.profile.status ?? 'ACTIVE'}</Badge>
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Department</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{query.data.profile.departmentName ?? 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Job role</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{query.data.profile.jobRoleTitle ?? 'Not provided'}</dd>
                </div>
              </dl>
            </Card>

            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-dim">Remaining capacity</p>
              <p className="mt-2 text-4xl font-bold text-ink">{query.data.remainingCapacity}%</p>
              <p className="mt-2 text-sm text-ink-muted">Currently allocated: {query.data.currentTotalAllocation}%</p>
            </Card>
          </section>

          <Card className="p-5">
            <h2 className="font-semibold text-ink">Skills</h2>
            {query.data.skills.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No skills have been recorded yet.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {query.data.skills.map((skill, index) => (
                  <Badge key={skill.id ?? index} variant="blue">
                    {skill.name ?? skill.skillName ?? 'Skill'}
                    {skill.proficiency ? ` · ${skill.proficiency}` : ''}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <AllocationList title="Current allocations" items={query.data.currentAllocations} />
            <AllocationList title="Planned allocations" items={query.data.plannedAllocations} />
          </section>
        </>
      )}
    </div>
  )
}
