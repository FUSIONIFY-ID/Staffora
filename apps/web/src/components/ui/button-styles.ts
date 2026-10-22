export interface ButtonStyleOptions {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const BASE_STYLES =
  'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

const SIZE_STYLES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
}

const VARIANT_STYLES = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 focus:ring-blue-500 active:scale-[0.98]',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500',
  outline:
    'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700 hover:border-slate-500 focus:ring-slate-500',
  danger: 'bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 focus:ring-red-500',
  ghost:
    'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white focus:ring-slate-500',
}

/**
 * Button visuals as a class string.
 *
 * Lives outside `button.tsx` for two reasons: navigation needs button styling on
 * a real `<Link>` (nesting a `<button>` inside an `<a>` is invalid interactive
 * markup), and a component module may only export components to keep React Fast
 * Refresh working.
 */
export function buttonStyles({ variant = 'primary', size = 'md' }: ButtonStyleOptions = {}): string {
  return `${BASE_STYLES} ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]}`
}
