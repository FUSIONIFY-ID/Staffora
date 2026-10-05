import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../src/features/auth/login-page.js'
import * as AuthContextModule from '../src/app/providers/auth-provider.js'
import { AppLayout } from '../src/app/layouts/app-layout.js'

describe('LoginPage (AC01 - Login Form)', () => {
  it('renders email, masked password, and submit button', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    // AC01.01: Email and Password fields provided
    const emailInput = screen.getByLabelText(/Work Email/i)
    const passwordInput = screen.getByLabelText(/Password/i)
    const submitButton = screen.getByRole('button', { name: /Sign In/i })

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    // AC01.04: Password masked by default
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(submitButton).toBeInTheDocument()
  })

  it('allows filling credentials and shows quick test hints', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const emailInput = screen.getByLabelText(/Work Email/i) as HTMLInputElement
    fireEvent.change(emailInput, { target: { value: 'admin@staffora.internal' } })
    expect(emailInput.value).toBe('admin@staffora.internal')

    expect(screen.getByText(/Quick Sign-in/i)).toBeInTheDocument()
  })
})

describe('AppLayout (AC02 - Role-based navigation)', () => {
  it('renders Admin navigation including Users, Dashboard, and Resources', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-admin',
        email: 'admin@staffora.internal',
        role: 'ADMIN',
        isActive: true,
        employee: {
          id: 'emp-admin',
          employeeCode: 'EMP-ADM01',
          fullName: 'System Administrator',
          workEmail: 'admin@staffora.internal',
          departmentId: 'dept-1',
          departmentName: 'Operations',
          jobRoleId: 'role-1',
          jobRoleTitle: 'Admin',
        },
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    })

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resources' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skills' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Capacity' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Allocations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument() // Admin only
    expect(screen.queryByRole('link', { name: 'My Profile' })).not.toBeInTheDocument() // Employee only
  })

  it('renders Employee navigation with My Profile and assigned Projects only', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-emp',
        email: 'emp@staffora.internal',
        role: 'EMPLOYEE',
        isActive: true,
        employee: {
          id: 'emp-1',
          employeeCode: 'EMP-001',
          fullName: 'Budi Santoso',
          workEmail: 'budi@staffora.internal',
          departmentId: 'dept-1',
          departmentName: 'Engineering',
          jobRoleId: 'role-1',
          jobRoleTitle: 'Full-Stack Developer',
        },
      },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn(),
    })

    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Profile' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Capacity' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Allocations' })).not.toBeInTheDocument()
  })
})
