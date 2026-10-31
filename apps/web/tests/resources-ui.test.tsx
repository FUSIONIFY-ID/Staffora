import type React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ResourceFilters } from '../src/features/resources/components/resource-filters.js'
import { ResourceFormModal } from '../src/features/resources/components/resource-form-modal.js'
import { ResourceTable } from '../src/features/resources/components/resource-table.js'
import type { EmployeeListFilters } from '../src/features/resources/api/resources-api.js'
import {
  ALL_EMPLOYEES,
  DEPARTMENT_DELIVERY,
  DEPARTMENT_ENGINEERING,
  EMPLOYEE_AVAILABLE,
  EMPLOYEE_PARTIAL,
  JOB_ROLE_DEVELOPER,
  JOB_ROLE_MANAGER,
} from './fixtures/resources-fixtures.js'

const BASE_FILTERS: EmployeeListFilters = {
  search: '',
  departmentId: '',
  jobRoleId: '',
  status: '',
  page: 1,
  pageSize: 20,
}

const DEPARTMENTS = [DEPARTMENT_ENGINEERING, DEPARTMENT_DELIVERY]
const JOB_ROLES = [JOB_ROLE_DEVELOPER, JOB_ROLE_MANAGER]

const renderTable = (canManage: boolean, onEdit = vi.fn()) =>
  render(
    <MemoryRouter>
      <ResourceTable employees={ALL_EMPLOYEES} canManage={canManage} onEdit={onEdit} />
    </MemoryRouter>,
  )

const renderFilters = (overrides: Partial<EmployeeListFilters> = {}) => {
  const onChange = vi.fn()
  const onReset = vi.fn()

  render(
    <ResourceFilters
      filters={{ ...BASE_FILTERS, ...overrides }}
      departments={DEPARTMENTS}
      jobRoles={JOB_ROLES}
      onChange={onChange}
      onReset={onReset}
    />,
  )

  return { onChange, onReset }
}

const renderForm = (props: Partial<React.ComponentProps<typeof ResourceFormModal>> = {}) => {
  const onSubmit = vi.fn()

  render(
    <ResourceFormModal
      isOpen
      employee={null}
      departments={DEPARTMENTS}
      jobRoles={JOB_ROLES}
      isSubmitting={false}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      {...props}
    />,
  )

  return { onSubmit }
}

describe('ResourceTable (AC01.01 - directory columns)', () => {
  it('renders one row per employee with code, name, email and department', () => {
    renderTable(false)

    expect(screen.getByRole('table', { name: /Employee resource directory/i })).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(ALL_EMPLOYEES.length + 1) // + header

    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Budi Santoso' })).toBeInTheDocument()
    expect(screen.getByText('budi.santoso@staffora.internal')).toBeInTheDocument()
  })

  it('shows all three availability states with distinct wording', () => {
    renderTable(false)

    expect(screen.getByText('100% available')).toBeInTheDocument()
    expect(screen.getByText('45% available')).toBeInTheDocument()
    expect(screen.getByText('Fully allocated')).toBeInTheDocument()
  })

  it('hides the edit action for roles that cannot manage resources', () => {
    renderTable(false)

    expect(screen.queryByRole('button', { name: /Edit Budi Santoso/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /View detail/i })).toHaveLength(ALL_EMPLOYEES.length)
  })

  it('exposes the edit action and calls back with the row when permitted', () => {
    const onEdit = vi.fn()
    renderTable(true, onEdit)

    fireEvent.click(screen.getByRole('button', { name: /Edit Budi Santoso/i }))

    expect(onEdit).toHaveBeenCalledWith(EMPLOYEE_AVAILABLE)
  })

  it('links each employee name to their detail route', () => {
    renderTable(false)

    expect(screen.getByRole('link', { name: 'Siti Rahayu' })).toHaveAttribute(
      'href',
      `/resources/${EMPLOYEE_PARTIAL.id}`,
    )
  })
})

describe('ResourceFilters (AC01.02 - search and filters)', () => {
  it('debounces the search term before notifying the parent', async () => {
    const { onChange } = renderFilters()

    fireEvent.change(screen.getByLabelText(/Search/i), { target: { value: 'budi' } })

    // The input updates immediately, but the query has not been pushed yet.
    expect(screen.getByLabelText(/Search/i)).toHaveValue('budi')
    expect(onChange).not.toHaveBeenCalled()

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ search: 'budi', page: 1 }), {
      timeout: 1500,
    })
  })

  it('applies a department filter immediately and resets to page 1', () => {
    const { onChange } = renderFilters()

    fireEvent.change(screen.getByLabelText(/Department/i), {
      target: { value: DEPARTMENT_DELIVERY.id },
    })

    expect(onChange).toHaveBeenCalledWith({ departmentId: DEPARTMENT_DELIVERY.id, page: 1 })
  })

  it('lists every department and job role as a selectable option', () => {
    renderFilters()

    expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Delivery' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Full-Stack Developer' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Delivery Manager' })).toBeInTheDocument()
  })

  it('disables the reset control when no filter is active', () => {
    renderFilters()

    expect(screen.getByRole('button', { name: /Reset filters/i })).toBeDisabled()
  })

  it('enables reset and invokes the handler once a filter is applied', () => {
    const { onReset } = renderFilters({ departmentId: DEPARTMENT_ENGINEERING.id })

    const resetButton = screen.getByRole('button', { name: /Reset filters/i })
    expect(resetButton).toBeEnabled()

    fireEvent.click(resetButton)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})

describe('ResourceFormModal (AC02 - create and edit forms)', () => {
  it('requires the mandatory fields before submitting', async () => {
    const { onSubmit } = renderForm()

    fireEvent.click(screen.getByRole('button', { name: /Create resource/i }))

    expect(await screen.findByText(/Employee code is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/Full name must be at least 2 characters/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a malformed work email', async () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: /Create resource/i }))

    expect(await screen.findByText(/Enter a valid work email address/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a complete create payload', async () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/Employee code/i), { target: { value: 'EMP009' } })
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Rina Kartika' } })
    fireEvent.change(screen.getByLabelText(/Work email/i), {
      target: { value: 'rina.kartika@staffora.internal' },
    })
    fireEvent.change(screen.getByLabelText(/Department/i), {
      target: { value: DEPARTMENT_ENGINEERING.id },
    })
    fireEvent.change(screen.getByLabelText(/Job role/i), {
      target: { value: JOB_ROLE_DEVELOPER.id },
    })

    fireEvent.click(screen.getByRole('button', { name: /Create resource/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeCode: 'EMP009',
        fullName: 'Rina Kartika',
        workEmail: 'rina.kartika@staffora.internal',
        departmentId: DEPARTMENT_ENGINEERING.id,
        jobRoleId: JOB_ROLE_DEVELOPER.id,
        status: 'ACTIVE',
      }),
      undefined,
    )
  })

  it('prefills the form and locks identity fields when editing', () => {
    renderForm({ employee: EMPLOYEE_PARTIAL })

    const codeInput = screen.getByLabelText(/Employee code/i)
    const emailInput = screen.getByLabelText(/Work email/i)

    expect(codeInput).toHaveValue('EMP002')
    expect(codeInput).toBeDisabled()
    expect(emailInput).toHaveValue('siti.rahayu@staffora.internal')
    expect(emailInput).toBeDisabled()
    expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument()
  })

  it('passes the employee id through when saving an edit', async () => {
    const { onSubmit } = renderForm({ employee: EMPLOYEE_PARTIAL })

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: 'Siti Rahayu Putri' } })
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[1]).toBe(EMPLOYEE_PARTIAL.id)
  })

  it('surfaces a server-side field error under the matching input', async () => {
    renderForm({
      submitError: 'Employee code already exists.',
      fieldErrors: { employeeCode: ['Employee code already exists.'] },
    })

    const codeInput = screen.getByLabelText(/Employee code/i)

    // The error is attached to the control itself, not only painted red.
    await waitFor(() => expect(codeInput).toHaveAttribute('aria-invalid', 'true'))
    expect(codeInput).toHaveAccessibleDescription('Employee code already exists.')

    // The banner explains the failure at the form level too.
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save the resource')
    expect(screen.getByRole('alert')).toHaveTextContent('Employee code already exists.')
  })
})
