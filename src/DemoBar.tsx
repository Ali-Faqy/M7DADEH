import { useLocation, useNavigate } from 'react-router-dom'
import { HardHat, RotateCcw, ShieldCheck, User } from 'lucide-react'
import { useStore } from './store'
import { useToast } from './ui'

const ROLES = [
  { key: 'admin', label: 'مدير الورشة', icon: ShieldCheck, to: '/admin' },
  { key: 'worker', label: 'العامل', icon: HardHat, to: '/worker' },
  { key: 'customer', label: 'الزبون', icon: User, to: '/customer' },
]

export default function DemoBar() {
  const { pathname } = useLocation(); const nav = useNavigate(); const { resetDemo } = useStore(); const toast = useToast()
  const cur = ROLES.find(r => pathname.startsWith('/' + r.key))?.key
  return (
    <div className="shrink-0 h-12 bg-ink text-white flex items-center gap-2 px-3 z-40">
      <span className="hidden sm:inline text-xs font-bold text-white/60 whitespace-nowrap">وضع العرض التجريبي</span>
      <div className="flex-1 flex justify-center">
        <div className="flex bg-white/10 rounded-full p-1 gap-1">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => nav(r.to)} className={`h-8 px-3 sm:px-4 rounded-full text-sm font-bold inline-flex items-center gap-1.5 transition ${cur === r.key ? 'bg-white text-ink' : 'text-white/80 hover:bg-white/10'}`}>
              <r.icon size={15} />{r.label}
            </button>
          ))}
        </div>
      </div>
      <button onClick={() => { resetDemo(); toast('تمت إعادة ضبط بيانات العرض', 'info') }} className="h-8 px-3 rounded-full text-xs font-bold text-white/80 hover:bg-white/10 inline-flex items-center gap-1.5 whitespace-nowrap" title="إعادة ضبط البيانات">
        <RotateCcw size={14} /><span className="hidden sm:inline">إعادة الضبط</span>
      </button>
    </div>
  )
}
