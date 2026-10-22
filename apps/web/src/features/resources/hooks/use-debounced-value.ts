import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 *
 * Used for the directory search box: typing updates the input immediately (so
 * the caret never lags) while the query only fires once the user pauses, which
 * keeps one request per pause instead of one per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
