import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils.js'

export interface DropdownItem {
  label: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'right',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-md focus:outline-none animate-fadeIn',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          role="menu"
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick()
                  setIsOpen(false)
                }
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-between',
                item.disabled
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : item.danger
                    ? 'text-red-400 hover:bg-red-500/10 cursor-pointer'
                    : 'text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
