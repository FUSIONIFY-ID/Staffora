import React from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../../../components/ui/button.js'
import type { Employee } from '../api/resources-api.js'
import { ResourceAvailabilityBadge } from './resource-availability-badge.js'

export interface ResourceTableProps {
  employees: Employee[]
  canManage: boolean
  onEdit: (employee: Employee) => void
}

export const ResourceTable: React.FC<ResourceTableProps> = ({ employees, canManage, onEdit }) => {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <caption className="sr-only">Employee resource directory</caption>
        <thead>
          <tr className="h-[46px] border-b border-line bg-surface-table-header text-left">
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Employee
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Code
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Allocation
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Availability
            </th>
            <th scope="col" className="px-6 py-3 text-xs font-semibold text-ink-muted">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-ink-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-divider">
          {employees.map((employee) => (
            <tr
              key={employee.id}
              onClick={() => navigate(`/resources/${employee.id}`)}
              className="h-[48px] cursor-pointer transition-colors hover:bg-surface-page/50"
            >
              <td className="px-6 py-3.5">
                <Link
                  to={`/resources/${employee.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-ink hover:text-primary transition-colors block"
                >
                  {employee.fullName}
                </Link>
                <span className="block text-xs text-ink-placeholder font-normal">
                  {employee.workEmail}
                </span>
              </td>
              <td className="px-6 py-3.5 text-sm text-ink-muted font-normal">
                {employee.employeeCode}
              </td>
              <td className="px-6 py-3.5 text-sm text-ink-muted">
                {employee.jobRoleTitle ?? '-'}
              </td>
              <td className="px-6 py-3.5 text-sm text-ink-muted">
                {employee.departmentName ?? '-'}
              </td>
              <td className="px-6 py-3.5 text-sm text-ink-muted">
                {employee.currentAllocation}%
              </td>
              <td className="px-6 py-3.5">
                <ResourceAvailabilityBadge employee={employee} />
              </td>
              <td className="px-6 py-3.5 text-sm text-ink-muted">
                {employee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </td>
              <td className="px-6 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    to={`/resources/${employee.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View detail
                  </Link>
                  {canManage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(employee)
                      }}
                      aria-label={`Edit ${employee.fullName}`}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
