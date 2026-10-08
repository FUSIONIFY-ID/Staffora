export type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index)
}

/**
 * Builds the visible page list with a stable slot count, always keeping the first and
 * last page and `siblings` pages around the current one, e.g. `1 … 9 10 11 … 20`.
 */
export function getPageItems(page: number, totalPages: number, siblings = 1): PageItem[] {
  if (totalPages <= 0) return []

  const edgeBlock = siblings * 2 + 3
  if (totalPages <= edgeBlock + 2) return range(1, totalPages)

  const current = Math.min(Math.max(page, 1), totalPages)

  if (current <= siblings + 3) {
    return [...range(1, edgeBlock), 'ellipsis-end', totalPages]
  }
  if (current >= totalPages - siblings - 2) {
    return [1, 'ellipsis-start', ...range(totalPages - edgeBlock + 1, totalPages)]
  }
  return [1, 'ellipsis-start', ...range(current - siblings, current + siblings), 'ellipsis-end', totalPages]
}
