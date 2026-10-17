import React from 'react'
import {
  useFormContext,
  Controller,
  type FieldValues,
  type FieldPath,
  type Control,
} from 'react-hook-form'
import { Label } from '../ui/label.js'
import { Input } from '../ui/input.js'
import { cn } from '../../lib/utils.js'

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const FormItem: React.FC<FormItemProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('space-y-1.5 text-left', className)} {...props}>
      {children}
    </div>
  )
}

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
  required?: boolean
}

export const FormLabel: React.FC<FormLabelProps> = ({ children, required, className, ...props }) => {
  return (
    <Label required={required} className={className} {...props}>
      {children}
    </Label>
  )
}

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
  error?: string
}

export const FormMessage: React.FC<FormMessageProps> = ({ children, error, className, ...props }) => {
  const content = error || children
  if (!content) return null

  return (
    <p className={cn('text-xs text-red-400 font-medium mt-1', className)} role="alert" {...props}>
      {content}
    </p>
  )
}

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
  control?: Control<TFieldValues>
  label?: string
  required?: boolean
  helperText?: string
  placeholder?: string
  type?: string
  id?: string
  className?: string
  disabled?: boolean
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  required,
  helperText,
  placeholder,
  type = 'text',
  id,
  className,
  disabled,
}: FormFieldProps<TFieldValues, TName>) {
  const formContext = useFormContext<TFieldValues>()
  const effectiveControl = control || formContext?.control

  if (!effectiveControl) {
    throw new Error('FormField must be used within FormProvider or pass a control prop')
  }

  const fieldId = id || `form-field-${String(name)}`

  return (
    <Controller
      name={name}
      control={effectiveControl}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel htmlFor={fieldId} required={required}>
              {label}
            </FormLabel>
          )}
          <Input
            {...field}
            id={fieldId}
            value={field.value ?? ''}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            error={fieldState.error?.message}
            helperText={helperText}
          />
        </FormItem>
      )}
    />
  )
}
