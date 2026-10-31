export interface ButtonStyleOptions {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const BASE_STYLES =
  'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
}

const VARIANT_STYLES = {
  primary:
    'bg-primary hover:bg-primary-hover text-white focus:ring-primary active:scale-[0.98]',
  secondary:
    'bg-surface-white hover:bg-surface-chip text-ink border border-line focus:ring-primary',
  outline:
    'bg-transparent hover:bg-surface-chip text-ink border border-line-input hover:border-ink-placeholder focus:ring-primary',
  danger: 'bg-danger hover:bg-danger-hover text-white focus:ring-danger',
  ghost:
    'bg-transparent hover:bg-surface-chip text-ink-muted hover:text-ink focus:ring-primary',
}

// Kept out of button.tsx so a <Link> can be styled as a button without nesting
// a <button> inside an <a>, and so that module only exports components.
export function buttonStyles({ variant = 'primary', size = 'md' }: ButtonStyleOptions = {}): string {
  return `${BASE_STYLES} ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]}`
}
