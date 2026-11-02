import React from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { Button } from '../../components/ui/button.js'
import { ResourceAllocationsTable } from './components/resource-allocations-table.js'
import { ResourceCapacityCard } from './components/resource-capacity-card.js'
import { ResourceFormModal } from './components/resource-form-modal.js'
import { ResourceProfileHeader } from './components/resource-profile-header.js'
import { ResourceSkillsCard } from './components/resource-skills-card.js'
import { ResourceErrorState, ResourceLoadingState } from './components/resource-states.js'
import { useDepartments, useEmployeeDetail, useJobRoles } from './hooks/use-resources.js'
import { useResourceForm } from './hooks/use-resource-form.js'
import { canManageResources } from './lib/resource-permissions.js'
import { normalizeError } from './lib/normalize-error.js'

export const ResourceDetailPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>()
  const { user } = useAuth()

  const detailQuery = useEmployeeDetail(employeeId)
  const departmentsQuery = useDepartments()
  const jobRolesQuery = useJobRoles()
  const form = useResourceForm()

  const canManage = canManageResources(user?.role)
  const resource = detailQuery.data

  if (detailQuery.isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ResourceLoadingState label="Loading resource profile..." />
      </div>
    )
  }

  if (detailQuery.isError || !resource) {
    const error = normalizeError(detailQuery.error)

    return (
      <div className="space-y-6">
        <BackLink />
        <ResourceErrorState
          title={error.isForbidden ? 'Access denied' : 'Could not load this resource'}
          message={error.message}
          onRetry={() => void detailQuery.refetch()}
          isRetrying={detailQuery.isFetching}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">{resource.fullName}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {resource.employeeCode} · {resource.jobRoleTitle ?? '-'} · {resource.departmentName ?? '-'}
          </p>
        </div>
        {canManage && (
          <Button type="button" variant="secondary" size="sm" onClick={() => form.openEdit(resource)}>
            Edit resource
          </Button>
        )}
      </div>

      {form.successMessage && (
        <Alert type="success" title="Saved">
          {form.successMessage}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ResourceProfileHeader resource={resource} />
        <ResourceSkillsCard skills={resource.skills} />
      </div>

      <ResourceCapacityCard resource={resource} />

      <ResourceAllocationsTable allocations={resource.allocations} />

      {canManage && (
        <ResourceFormModal
          isOpen={form.isOpen}
          employee={form.editing}
          departments={departmentsQuery.data ?? []}
          jobRoles={jobRolesQuery.data ?? []}
          isSubmitting={form.isSubmitting}
          submitError={form.error?.message}
          fieldErrors={form.error?.fieldErrors}
          onClose={form.close}
          onSubmit={form.submit}
        />
      )}
    </div>
  )
}

const BackLink: React.FC = () => (
  <Link
    to="/resources"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
  >
    <span aria-hidden="true">&larr;</span>
    Back to resources
  </Link>
)
