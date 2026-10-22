import React from 'react'
import { Link } from 'react-router'
import { Badge } from '../../../components/ui/badge.js'
import { Button } from '../../../components/ui/button.js'
import { buttonStyles } from '../../../components/ui/button-styles.js'
import type { Employee } from '../api/resources-api.js'
import { ResourceAvailabilityBadge } from './resource-availability-badge.js'

export interface ResourceTableProps {
  employees: Employee[]
  canManage: boolean
  onEdit: (employee: Employee) => void
}

// Edit only renders for roles that can persist the change; the backend rejects
// the PATCH for everyone else.
export const ResourceTable: React.FC<ResourceTableProps> = ({ employees, canManage, onEdit }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <caption className="sr-only">Employee resource directory</caption>
        <thead>
          <tr className="border-b border-slate-800 text-left">
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Employee code
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Full name
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Department
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Job role
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th scope="col" className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Capacity
            </th>
            <th scope="col" className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-slate-800/60 transition-colors hover:bg-slate-800/30"
            >
              <td className="px-3 py-3 font-mono text-xs text-slate-300">{employee.employeeCode}</td>
              <td className="px-3 py-3">
                <Link
                  to={`/resources/${employee.id}`}
                  className="font-medium text-slate-100 hover:text-blue-400 hover:underline underline-offset-4"
                >
                  {employee.fullName}
                </Link>
              </td>
              <td className="px-3 py-3 text-slate-400">{employee.workEmail}</td>
              <td className="px-3 py-3 text-slate-300">{employee.departmentName ?? '-'}</td>
              <td className="px-3 py-3 text-slate-300">{employee.jobRoleTitle ?? '-'}</td>
              <td className="px-3 py-3">
                <Badge variant={employee.status === 'ACTIVE' ? 'green' : 'gray'}>
                  {employee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <ResourceAvailabilityBadge employee={employee} />
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link to={`/resources/${employee.id}`} className={buttonStyles({ variant: 'outline', size: 'sm' })}>
                    View detail
                  </Link>
                  {canManage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(employee)}
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
