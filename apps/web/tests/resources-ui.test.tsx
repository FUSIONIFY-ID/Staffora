import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Routes, Route } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ResourcesPage } from '../src/features/resources/resources-page.js'
import { ResourceDetailPage } from '../src/features/resources/resource-detail-page.js'
import { ApiError } from '../src/api/client.js'

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }))
vi.mock('../src/api/client.js', async () => {
  const actual = await vi.importActual<typeof import('../src/api/client.js')>('../src/api/client.js')
  return {
    ...actual,
    apiClient,
  }
})

let mockCurrentUser = { role: 'ADMIN', email: 'admin@staffora.test' }
vi.mock('../src/app/providers/auth-provider.js', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}))

function renderWithClient(
  ui: React.ReactNode,
  options?: { initialEntries?: string[]; queryClient?: QueryClient },
): { queryClient: QueryClient } {
  const queryClient =
    options?.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={options?.initialEntries ?? ['/resources']}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
  return { queryClient }
}

function renderDetailWithClient(employeeId: string): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/resources/${employeeId}`]}>
        <Routes>
          <Route path="/resources/:employeeId" element={<ResourceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const mockEmployeeData = [
  {
    id: 'emp-101',
    employeeCode: 'EMP001',
    fullName: 'Budi Santoso',
    workEmail: 'budi@staffora.test',
    departmentId: 'dept-1',
    departmentName: 'Engineering',
    jobRoleId: 'role-1',
    jobRoleTitle: 'Senior Backend Engineer',
    status: 'ACTIVE',
    currentAllocation: 60,
    currentRemainingCapacity: 40,
  },
  {
    id: 'emp-102',
    employeeCode: 'EMP002',
    fullName: 'Siti Aminah',
    workEmail: 'siti@staffora.test',
    departmentId: 'dept-2',
    departmentName: 'Design',
    jobRoleId: 'role-2',
    jobRoleTitle: 'UI/UX Designer',
    status: 'INACTIVE',
    currentAllocation: 0,
    currentRemainingCapacity: null, // explicit missing capacity
  },
]

describe('US02.01 - Employee Resource Directory & Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentUser = { role: 'ADMIN', email: 'admin@staffora.test' }
  })

  it('renders resource directory table with availability indicators and explicit missing state', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Developer' }] })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({
          data: mockEmployeeData,
          meta: { page: 1, pageSize: 20, total: 2 },
        })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument()
    // Explicit 40% availability badge
    expect(screen.getByText('40% Tersedia')).toBeInTheDocument()
    // Explicit missing availability badge (does not default to 100%)
    expect(screen.getByText('Tidak Tersedia')).toBeInTheDocument()
    expect(screen.queryByText('100% Tersedia')).not.toBeInTheDocument()
  })

  it('handles empty state when no employees match filters', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    expect(await screen.findByText('Tidak Ada Karyawan Ditemukan')).toBeInTheDocument()
  })

  it('handles network failure state and provides retry button', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees')) {
        return Promise.reject(new TypeError('Failed to fetch'))
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    expect(await screen.findByText('Gangguan Koneksi Jaringan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument()
  })

  it('handles 403 Forbidden authorization failure without retry button', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees')) {
        return Promise.reject(new ApiError(403, { code: 'FORBIDDEN', message: 'Forbidden access' }))
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    expect(await screen.findByText('403 - Akses Ditolak')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Coba Lagi' })).not.toBeInTheDocument()
  })

  it('handles dropdown API failure in filters with retry option', async () => {
    let deptCallCount = 0
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        deptCallCount++
        if (deptCallCount === 1) {
          return Promise.reject(new Error('Failed to load departments'))
        }
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Developer' }] })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: mockEmployeeData, meta: { page: 1, pageSize: 20, total: 2 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    const retryBtn = await screen.findByRole('button', { name: 'Gagal. Coba lagi' })
    expect(retryBtn).toBeInTheDocument()
    fireEvent.click(retryBtn)

    await waitFor(() => {
      expect(deptCallCount).toBeGreaterThanOrEqual(2)
    })
  })

  it('triggers search and filters on input change and resets to page 1', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Engineer' }] })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: mockEmployeeData, meta: { page: 2, pageSize: 20, total: 40 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />, { initialEntries: ['/resources?page=2'] })
    await screen.findByText('Budi Santoso')

    const searchInput = screen.getByLabelText('Cari Karyawan')
    fireEvent.change(searchInput, { target: { value: 'Budi' } })

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('search=Budi'))
      // Changing search/filter must reset page back to 1
      expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    })
  })

  it('hides create/edit actions for PROJECT_MANAGER (read-only mode)', async () => {
    mockCurrentUser = { role: 'PROJECT_MANAGER', email: 'pm@staffora.test' }
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: mockEmployeeData, meta: { page: 1, pageSize: 20, total: 2 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)
    await screen.findByText('Budi Santoso')

    expect(screen.queryByText('+ Tambah Karyawan')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Detail' })).toHaveLength(2)
  })

  it('opens create modal and validates required fields', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Backend' }] })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    const createBtn = await screen.findByRole('button', { name: '+ Tambah Karyawan' })
    fireEvent.click(createBtn)

    expect(await screen.findByText('Tambah Karyawan Baru')).toBeInTheDocument()

    // Submit without input
    fireEvent.click(screen.getByRole('button', { name: 'Tambah Karyawan' }))

    expect(await screen.findByText('Kode karyawan wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Nama lengkap minimal 2 karakter')).toBeInTheDocument()
  })

  it('submits create employee and invalidates queries on success', async () => {
    apiClient.mockImplementation((endpoint: string, options?: RequestInit) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Developer' }] })
      }
      if (endpoint.startsWith('/employees') && options?.method === 'POST') {
        return Promise.resolve({ data: { id: 'new-emp-1' } })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })
      }
      return Promise.resolve({ data: [] })
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderWithClient(<ResourcesPage />, { queryClient })

    fireEvent.click(await screen.findByRole('button', { name: '+ Tambah Karyawan' }))

    fireEvent.change(screen.getByLabelText('Kode Karyawan'), { target: { value: 'EMP999' } })
    fireEvent.change(screen.getByLabelText('Nama Lengkap'), { target: { value: 'Rina Wijaya' } })
    fireEvent.change(screen.getByLabelText('Email Kerja'), { target: { value: 'rina@staffora.test' } })

    fireEvent.click(screen.getByRole('button', { name: 'Tambah Karyawan' }))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        '/employees',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['employees'] }))
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['dashboard'] }))
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['capacity'] }))
    })
  })

  it('submits edit employee and invalidates specific detail query [employee, id]', async () => {
    apiClient.mockImplementation((endpoint: string, options?: RequestInit) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Senior Backend Engineer' }] })
      }
      if (endpoint === '/employees/emp-101' && options?.method === 'PATCH') {
        return Promise.resolve({ data: { id: 'emp-101', fullName: 'Budi Santoso Updated' } })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: mockEmployeeData, meta: { page: 1, pageSize: 20, total: 2 } })
      }
      return Promise.resolve({ data: [] })
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderWithClient(<ResourcesPage />, { queryClient })

    await screen.findByText('Budi Santoso')
    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    fireEvent.click(editButtons[0])

    expect(await screen.findByText('Edit Profil Karyawan')).toBeInTheDocument()
    const nameInput = screen.getByLabelText('Nama Lengkap')
    fireEvent.change(nameInput, { target: { value: 'Budi Santoso Updated' } })

    fireEvent.click(screen.getByRole('button', { name: 'Perbarui Karyawan' }))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(
        '/employees/emp-101',
        expect.objectContaining({ method: 'PATCH' }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['employee', 'emp-101'] }),
      )
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['employees'] }))
    })
  })

  it('renders resource detail with skills, allocations, and evaluated capacity', async () => {
    const detailData = {
      ...mockEmployeeData[0],
      skills: [
        { id: 'sk-1', skillId: 's-1', skillName: 'TypeScript', proficiencyLevel: 4 },
        { id: 'sk-2', skillId: 's-2', skillName: 'Node.js', proficiencyLevel: 5 },
      ],
      allocations: [
        {
          id: 'al-1',
          projectId: 'p-1',
          projectName: 'Staffora Platform',
          jobRoleId: 'role-1',
          jobRoleTitle: 'Backend Engineer',
          allocationPercentage: 50,
          startDate: '2026-10-01',
          endDate: '2026-11-30',
        },
      ],
      evaluatedPeriod: {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        peakConcurrentAllocation: 50,
        remainingCapacity: 50,
      },
    }

    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees/emp-101')) {
        return Promise.resolve({ data: detailData })
      }
      return Promise.resolve({ data: [] })
    })

    renderDetailWithClient('emp-101')

    expect(await screen.findByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Level 4 - Advanced')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('Level 5 - Expert')).toBeInTheDocument()
    expect(screen.getByText('Staffora Platform')).toBeInTheDocument()
    expect(screen.getByText('50% Kapasitas Tersedia')).toBeInTheDocument()
  })

  it('handles 404 Not Found error state on resource detail page', async () => {
    apiClient.mockImplementation(() => {
      return Promise.reject(new ApiError(404, { code: 'NOT_FOUND', message: 'Employee not found.' }))
    })

    renderDetailWithClient('emp-999')

    expect(await screen.findByText('Karyawan Tidak Ditemukan')).toBeInTheDocument()
    expect(screen.getByText(/tidak ditemukan dalam basis data/i)).toBeInTheDocument()
  })

  it('handles 403 Forbidden error state on resource detail page', async () => {
    apiClient.mockImplementation(() => {
      return Promise.reject(new ApiError(403, { code: 'FORBIDDEN', message: 'Forbidden access.' }))
    })

    renderDetailWithClient('emp-secret')

    expect(await screen.findByText('Akses Ditolak')).toBeInTheDocument()
  })

  it('displays duplicate error alert when API returns 409 conflict', async () => {
    apiClient.mockImplementation((endpoint: string, options?: RequestInit) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Developer' }] })
      }
      if (endpoint.startsWith('/employees') && options?.method === 'POST') {
        return Promise.reject(
          new ApiError(409, {
            code: 'CONFLICT',
            message: 'A user or employee with this code or email already exists.',
          }),
        )
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    fireEvent.click(await screen.findByRole('button', { name: '+ Tambah Karyawan' }))

    fireEvent.change(screen.getByLabelText('Kode Karyawan'), { target: { value: 'EMP001' } })
    fireEvent.change(screen.getByLabelText('Nama Lengkap'), { target: { value: 'Duplikat User' } })
    fireEvent.change(screen.getByLabelText('Email Kerja'), { target: { value: 'budi@staffora.test' } })

    fireEvent.click(screen.getByRole('button', { name: 'Tambah Karyawan' }))

    expect(await screen.findByText('Gagal Menyimpan')).toBeInTheDocument()
    expect(
      screen.getByText(/already exists|sudah terdaftar/i),
    ).toBeInTheDocument()
  })

  it('handles pagination navigation when changing pages', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({
          data: mockEmployeeData,
          meta: { page: 1, pageSize: 20, total: 40, totalPages: 2 },
        })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />)

    expect(await screen.findByText('Halaman 1 dari 2')).toBeInTheDocument()
    const nextBtn = screen.getByRole('button', { name: 'Berikutnya' })
    expect(nextBtn).toBeEnabled()

    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith(expect.stringContaining('page=2'))
    })
  })

  it('displays active filter chips and allows clearing individual filters', async () => {
    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint === '/departments') {
        return Promise.resolve({ data: [{ id: 'dept-1', name: 'Engineering' }] })
      }
      if (endpoint === '/job-roles') {
        return Promise.resolve({ data: [{ id: 'role-1', name: 'Developer' }] })
      }
      if (endpoint.startsWith('/employees')) {
        return Promise.resolve({ data: mockEmployeeData, meta: { page: 1, pageSize: 20, total: 2 } })
      }
      return Promise.resolve({ data: [] })
    })

    renderWithClient(<ResourcesPage />, {
      initialEntries: ['/resources?search=Budi&departmentId=dept-1&status=ACTIVE'],
    })

    expect(await screen.findByText('Filter Aktif:')).toBeInTheDocument()
    expect(screen.getByText(/Cari: “Budi”/)).toBeInTheDocument()
    expect(await screen.findByText(/Dept: Engineering/)).toBeInTheDocument()
    expect(screen.getByText(/Status: Aktif/)).toBeInTheDocument()

    // Clear search chip
    const clearSearchBtn = screen.getByRole('button', { name: 'Hapus filter pencarian' })
    fireEvent.click(clearSearchBtn)

    await waitFor(() => {
      expect(screen.queryByText(/Cari: “Budi”/)).not.toBeInTheDocument()
    })
  })

  it('renders inactive employee banner and historical allocation notice on detail page', async () => {
    const inactiveDetailData = {
      ...mockEmployeeData[1],
      skills: [{ id: 'sk-1', skillId: 's-1', skillName: 'UI Design', proficiencyLevel: 3 }],
      allocations: [
        {
          id: 'al-past-1',
          projectId: 'p-legacy-1',
          projectName: 'Legacy Portal',
          jobRoleId: 'role-2',
          jobRoleTitle: 'UI Designer',
          allocationPercentage: 100,
          startDate: '2026-01-01',
          endDate: '2026-06-30',
        },
      ],
      evaluatedPeriod: {
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        peakConcurrentAllocation: 0,
        remainingCapacity: 100,
      },
    }

    apiClient.mockImplementation((endpoint: string) => {
      if (endpoint.startsWith('/employees/emp-102')) {
        return Promise.resolve({ data: inactiveDetailData })
      }
      return Promise.resolve({ data: [] })
    })

    renderDetailWithClient('emp-102')

    expect(await screen.findByText('Siti Aminah')).toBeInTheDocument()
    // Verify Inactive status warning banner
    expect(screen.getByText('Karyawan Berstatus Non-Aktif:')).toBeInTheDocument()
    expect(screen.getByText(/Legacy Portal/i)).toBeInTheDocument()
    // Verify historical preservation notice
    expect(
      screen.getByText(/Riwayat penugasan proyek tetap diarsipkan dan dipertahankan dalam sistem/i),
    ).toBeInTheDocument()
    // Verify capacity visual meter texts
    expect(screen.getByText(/Beban Kerja Terpakai \(Peak: 0%\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Sisa Kapasitas \(100%\)/i)).toBeInTheDocument()
  })
})


