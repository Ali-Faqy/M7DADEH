import { Check, X, RotateCcw, ClipboardList, FileCheck2, Ruler, Hammer, Truck, ShieldCheck, Wrench, PackageCheck, type LucideIcon } from 'lucide-react'
import { STAGES, type Order } from '../types'
import { stageState, type StageState } from '../store'

export const stageIcons: LucideIcon[] = [ClipboardList, FileCheck2, Ruler, Hammer, Truck, ShieldCheck, Wrench, PackageCheck]

const circle: Record<StageState, string> = {
  done: 'bg-brand text-white border-brand',
  current: 'bg-white text-brand border-brand border-[3px] ring',
  pending: 'bg-card text-mute border-line',
  rework: 'bg-warn text-white border-warn',
  rejected: 'bg-bad text-white border-bad',
}
const label: Record<StageState, string> = {
  done: 'text-ink', current: 'text-brand-dark font-extrabold', pending: 'text-mute', rework: 'text-[#a85f14] font-extrabold', rejected: 'text-bad font-extrabold',
}
const caption: Record<StageState, string> = { done: 'مكتملة', current: 'الحالية', pending: 'قادمة', rework: 'إعادة عمل', rejected: 'مرفوضة' }

/** Horizontal workflow stepper (admin) */
export function Stepper({ order, selected, onSelect }: { order: Order; selected?: number; onSelect?: (i: number) => void }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-[760px]">
        {STAGES.map((s, i) => {
          const st = stageState(order, i)
          const Icon = stageIcons[i]
          const isSel = selected === i
          return (
            <button key={s.key} onClick={() => onSelect?.(i)} className={`relative flex-1 flex flex-col items-center gap-1.5 px-1 pt-2 pb-2 rounded-xl transition ${isSel ? 'bg-card' : 'hover:bg-card/60'}`}>
              <span className={`w-12 h-12 rounded-full grid place-items-center border-2 relative z-10 ${circle[st]}`}>
                {st === 'done' ? <Check size={22} strokeWidth={3} /> : st === 'rejected' ? <X size={22} strokeWidth={3} /> : st === 'rework' ? <RotateCcw size={20} /> : <Icon size={20} />}
              </span>
              <span className={`text-[13px] leading-tight text-center ${label[st]}`}>{s.label}</span>
              <span className="text-[11px] text-mute">{caption[st]}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex items-center gap-1 px-1">
        {STAGES.map((_, i) => {
          const st = stageState(order, i)
          return <div key={i} className={`flex-1 h-1.5 rounded-full ${st === 'done' ? 'bg-brand' : st === 'current' ? 'bg-brand/60' : st === 'rework' ? 'bg-warn' : st === 'rejected' ? 'bg-bad' : 'bg-line'}`} />
        })}
      </div>
    </div>
  )
}

/** Mini dots stepper for lists */
export function MiniStepper({ order }: { order: Order }) {
  return (
    <div className="flex items-center gap-1" title="مراحل الطلبية">
      {STAGES.map((s, i) => {
        const st = stageState(order, i)
        const c = st === 'done' ? 'bg-brand' : st === 'current' ? 'bg-brand ring' : st === 'rework' ? 'bg-warn' : st === 'rejected' ? 'bg-bad' : 'bg-line'
        return <span key={s.key} className={`w-3 h-3 rounded-full ${c}`} />
      })}
    </div>
  )
}
