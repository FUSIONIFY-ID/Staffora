import React, { useState } from 'react'
import { Button } from '../../../components/ui/button.js'
import { Input } from '../../../components/ui/input.js'
import type { EvaluatedCapacity } from './types.js'

export interface ResourceCapacityCardProps {
  currentAllocation: number
  currentRemainingCapacity: number
  evaluatedPeriod?: EvaluatedCapacity
  onEvaluateRange: (startDate: string, endDate: string) => void
}

export const ResourceCapacityCard: React.FC<ResourceCapacityCardProps> = ({
  currentAllocation,
  currentRemainingCapacity,
  evaluatedPeriod,
  onEvaluateRange,
}): React.JSX.Element => {
  const [startDate, setStartDate] = useState(
    evaluatedPeriod?.startDate ?? new Date().toISOString().slice(0, 10),
  )
  const [endDate, setEndDate] = useState(() => {
    if (evaluatedPeriod?.endDate) return evaluatedPeriod.endDate
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)

  const peak = evaluatedPeriod?.peakConcurrentAllocation ?? currentAllocation
  const remaining = evaluatedPeriod?.remainingCapacity ?? currentRemainingCapacity

  const handleApply = (e: React.FormEvent): void => {
    e.preventDefault()
    if (startDate <= endDate) {
      onEvaluateRange(startDate, endDate)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Current capacity</h2>
        <button
          type="button"
          onClick={() => setShowEvaluationForm((prev) => !prev)}
          className="text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors"
        >
          {showEvaluationForm ? 'Tutup Filter Periode' : '⚙️ Evaluasi Periode'}
        </button>
      </div>

      {/* Capacity Progress Bar matching Figma */}
      <div className="space-y-3">
        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, peak))}%` }}
          />
        </div>

        {/* Labels matching Figma */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="font-semibold text-blue-600">{peak}% allocated</span>
            <span className="sr-only">Beban Kerja Terpakai (Peak: {peak}%)</span>
          </div>
          <div>
            <span className="font-semibold text-emerald-600">{remaining}% remaining capacity</span>
            <span className="sr-only">Sisa Kapasitas ({remaining}%)</span>
            <span className="sr-only">{remaining}% Kapasitas Tersedia</span>
          </div>
        </div>
      </div>

      {/* Date Range Evaluation Form */}
      {showEvaluationForm && (
        <form onSubmit={handleApply} className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
          <Input
            id="capacity-start-date"
            label="Tanggal Mulai"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            id="capacity-end-date"
            label="Tanggal Selesai"
            type="date"
            min={startDate}
            value={endDate}
            error={startDate > endDate ? 'Tanggal selesai harus >= tanggal mulai' : undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button
            id="capacity-apply-range"
            type="submit"
            variant="secondary"
            disabled={startDate > endDate}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
          >
            Evaluasi Rentang Waktu
          </Button>
        </form>
      )}
    </div>
  )
}
