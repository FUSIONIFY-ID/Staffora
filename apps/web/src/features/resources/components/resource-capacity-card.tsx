import React, { useState } from 'react'
import { Card } from '../../../components/ui/card.js'
import { Badge } from '../../../components/ui/badge.js'
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

  const peak = evaluatedPeriod?.peakConcurrentAllocation ?? currentAllocation
  const remaining = evaluatedPeriod?.remainingCapacity ?? currentRemainingCapacity

  const handleApply = (e: React.FormEvent): void => {
    e.preventDefault()
    if (startDate <= endDate) {
      onEvaluateRange(startDate, endDate)
    }
  }

  const availVariant = remaining === 100 ? 'green' : remaining > 0 ? 'amber' : 'red'
  const isOverAllocated = peak >= 100

  return (
    <Card className="border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Analisis Kapasitas & Beban Kerja</h2>
            <Badge variant="blue">Capacity Engine</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dihitung secara deterministik oleh Capacity Engine backend tanpa kompromi konflik over-allocation.
          </p>
        </div>
        <Badge variant={availVariant} className="gap-1.5 py-1 px-3 text-xs font-semibold">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              remaining === 100 ? 'bg-emerald-400' : remaining > 0 ? 'bg-amber-400' : 'bg-red-400'
            }`}
          />
          {remaining}% Kapasitas Tersedia
        </Badge>
      </div>

      {/* Visual Capacity Meter Bar */}
      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-4 shadow-inner">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Beban Kerja Terpakai (Peak: {peak}%)</span>
          <span className="text-emerald-400">Sisa Kapasitas ({remaining}%)</span>
        </div>
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
          {/* Used Capacity Segment */}
          <div
            className={`h-full transition-all duration-500 ${
              isOverAllocated
                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                : peak > 70
                ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, peak))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-0.5 font-mono">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Date Range Evaluation Form */}
      <form onSubmit={handleApply} className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
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
          className="w-full hover:border-slate-500"
        >
          Evaluasi Rentang Waktu
        </Button>
      </form>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 text-center shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alokasi Hari Ini</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{currentAllocation}%</p>
          <p className="mt-1 text-xs text-slate-400">Beban kerja aktif saat ini</p>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 text-center shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Beban Puncak (Peak)</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{peak}%</p>
          <p className="mt-1 text-xs text-slate-400">Alokasi maksimal pada rentang</p>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-4 text-center shadow-lg shadow-black/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sisa Kapasitas</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-400">{remaining}%</p>
          <p className="mt-1 text-xs text-slate-400">Kapasitas aman yang tersisa</p>
        </div>
      </div>
    </Card>
  )
}

