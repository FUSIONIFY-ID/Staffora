import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField } from '../src/components/ui/form.js'
import { Button } from '../src/components/ui/button.js'

const testSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
})

type TestFormValues = z.infer<typeof testSchema>

const TestFormComponent = ({ onSubmit }: { onSubmit: (data: TestFormValues) => void }) => {
  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: { fullName: '', email: '' },
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField name="fullName" label="Full Name" placeholder="Enter name" required />
        <FormField name="email" label="Email" placeholder="Enter email" type="email" />
        <Button type="submit">Submit Form</Button>
      </form>
    </FormProvider>
  )
}

describe('Form Foundation (React Hook Form + Zod)', () => {
  it('renders form inputs with labels', () => {
    render(<TestFormComponent onSubmit={vi.fn()} />)
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('validates schema and renders error messages on invalid submit', async () => {
    const handleSubmit = vi.fn()
    render(<TestFormComponent onSubmit={handleSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /Submit Form/i }))

    await waitFor(() => {
      expect(screen.getByText('Full name must be at least 3 characters')).toBeInTheDocument()
      expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('submits valid data when fields are filled correctly', async () => {
    const handleSubmit = vi.fn()
    render(<TestFormComponent onSubmit={handleSubmit} />)

    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'jane@staffora.internal' } })

    fireEvent.click(screen.getByRole('button', { name: /Submit Form/i }))

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        { fullName: 'Jane Doe', email: 'jane@staffora.internal' },
        expect.anything(),
      )
    })
  })
})
