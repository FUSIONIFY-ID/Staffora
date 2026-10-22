import React, { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../../app/providers/auth-provider.js'
import { Alert } from '../../components/ui/alert.js'
import { Badge } from '../../components/ui/badge.js'
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

/**
 * Resource directory (PRD US02.01 - AC01).
 *
 * State handling note: filters, page and pageSize live in one object because
 * they are always read together to build the query key. Any change other than a
 * pure page change resets `page` to 1 — a filter that shrinks the result set
 * while staying on page 5 would otherwise render an empty table that looks like
 * "no results" rather than "wrong page".
 */
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

  // First load with nothing to show yet -> full-page loading state. A background
  // refetch keeps the table mounted and only dims it, so the layout never jumps.
  const isInitialLoading = listQuery.isPending && !listQuery.data

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Resource Directory</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse employee profiles, skills and current capacity across the organisation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {meta && <Badge variant="blue">{meta.total} resources</Badge>}
          {canManage && (
            <Button type="button" onClick={form.openCreate}>
              Add resource
            </Button>
          )}
        </div>
      </header>

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
        onChange={patchFilters}
        onReset={resetFilters}
      />

      <Card className="p-4 sm:p-6">
        {isInitialLoading && <ResourceLoadingState label="Loading resource directory..." />}

        {!isInitialLoading && listError && (
          <ResourceErrorState
            title={listError.isForbidden ? 'Access denied' : 'Could not load resources'}
            message={listError.message}
            onRetry={() => void listQuery.refetch()}
            isRetrying={listQuery.isFetching}
          />
        )}

        {!isInitialLoading && !listError && employees.length === 0 && (
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
        )}

        {!isInitialLoading && !listError && employees.length > 0 && (
          <>
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
            {meta && (
              <div className="mt-4">
                <ResourcePagination
                  meta={meta}
                  isFetching={listQuery.isFetching}
                  onPageChange={(page) => patchFilters({ page })}
                  onPageSizeChange={(pageSize) => patchFilters({ pageSize, page: 1 })}
                />
              </div>
            )}
          </>
        )}
      </Card>

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
