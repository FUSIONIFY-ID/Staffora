import React, { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { Button } from '../../components/ui/button.js'
import { Card } from '../../components/ui/card.js'
import type { EmployeeListFilters } from './api/resources-api.js'
import { ResourceFilters } from './components/resource-filters.js'
import { ResourceFormModal } from './components/resource-form-modal.js'
import { ResourcePagination } from './components/resource-pagination.js'
import { ResourceTable } from './components/resource-table.js'
import {
  ResourceEmptyState,
  ResourceErrorState,
  ResourceLoadingState,
  ResourceReadOnlyNotice,
} from './components/resource-states.js'
import { useDepartments, useEmployeeList, useJobRoles } from './hooks/use-resources.js'
import { useResourceForm } from './hooks/use-resource-form.js'
import { canManageResources } from './lib/resource-permissions.js'
import { normalizeError } from './lib/normalize-error.js'

const DEFAULT_PAGE_SIZE = 20

const INITIAL_FILTERS: EmployeeListFilters = {
  search: '',
  departmentId: '',
  jobRoleId: '',
  status: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
}

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth()
  const [filters, setFilters] = useState<EmployeeListFilters>(INITIAL_FILTERS)

  const listQuery = useEmployeeList(filters)
  const departmentsQuery = useDepartments()
  const jobRolesQuery = useJobRoles()
  const form = useResourceForm()

  const canManage = canManageResources(user?.role)

  const patchFilters = useCallback((patch: Partial<EmployeeListFilters>) => {
    setFilters((current) => ({ ...current, ...patch }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS, pageSize: filters.pageSize })
  }, [filters.pageSize])

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== '' ||
      filters.departmentId !== '' ||
      filters.jobRoleId !== '' ||
      filters.status !== '',
    [filters.search, filters.departmentId, filters.jobRoleId, filters.status],
  )

  const employees = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const listError = listQuery.isError ? normalizeError(listQuery.error) : null
  const isInitialLoading = listQuery.isPending && !listQuery.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Resources</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Search, filter, and manage employee resource profiles.
        </p>
      </div>

      {!canManage && user && <ResourceReadOnlyNotice role={user.role} />}

      {form.successMessage && (
        <Alert type="success" title="Saved">
          <div className="flex items-center justify-between gap-4">
            <span>{form.successMessage}</span>
            <Button type="button" variant="ghost" size="sm" onClick={form.dismissSuccess}>
              Dismiss
            </Button>
          </div>
        </Alert>
      )}

      <ResourceFilters
        filters={filters}
        departments={departmentsQuery.data ?? []}
        jobRoles={jobRolesQuery.data ?? []}
        isMasterDataLoading={departmentsQuery.isPending || jobRolesQuery.isPending}
        onAddResource={canManage ? form.openCreate : undefined}
        onChange={patchFilters}
        onReset={resetFilters}
      />

      {isInitialLoading && (
        <Card className="p-6">
          <ResourceLoadingState label="Loading resource directory..." />
        </Card>
      )}

      {!isInitialLoading && listError && (
        <Card className="p-6">
          <ResourceErrorState
            title={listError.isForbidden ? 'Access denied' : 'Could not load resources'}
            message={listError.message}
            onRetry={() => void listQuery.refetch()}
            isRetrying={listQuery.isFetching}
          />
        </Card>
      )}

      {!isInitialLoading && !listError && employees.length === 0 && (
        <Card className="p-6">
          <ResourceEmptyState
            title={hasActiveFilters ? 'No resources match these filters' : 'No resources yet'}
            description={
              hasActiveFilters
                ? 'Try a different search term, or clear the filters to see the whole directory.'
                : 'Employee records will appear here once they are added to the workforce directory.'
            }
            onReset={hasActiveFilters ? resetFilters : undefined}
            resetLabel="Clear filters"
          />
        </Card>
      )}

      {!isInitialLoading && !listError && employees.length > 0 && (
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div
              className={listQuery.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}
              aria-busy={listQuery.isFetching}
            >
              <ResourceTable
                employees={employees}
                canManage={canManage}
                onEdit={form.openEdit}
              />
            </div>
          </Card>

          {meta && (
            <ResourcePagination
              meta={meta}
              isFetching={listQuery.isFetching}
              onPageChange={(page) => patchFilters({ page })}
              onPageSizeChange={(pageSize) => patchFilters({ pageSize, page: 1 })}
            />
          )}
        </div>
      )}

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
