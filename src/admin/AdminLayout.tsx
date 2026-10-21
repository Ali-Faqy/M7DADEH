import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, FolderKanban, Hammer, LayoutDashboard, MapPin, PackageCheck, RotateCcw, ClipboardList, Ruler, ShieldCheck, Truck, Users, Wrench, type LucideIcon } from 'lucide-react'
import { ScrollArea } from '../ui'
import { useStore } from '../store'

const NAV: { to: string; label: string; icon: LucideIcon; stage?: number; end?: boolean }[] = [
  { to: '/admin', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/admin/projects', label: 'المشاريع', icon: FolderKanban },
  { to: '/admin/orders', label: 'الطلبيات', icon: ClipboardList },
  { to: '/admin/survey', label: 'المسح الميداني', icon: MapPin, stage: 0 },
  { to: '/admin/measurements', label: 'القياسات', icon: Ruler, stage: 2 },
  { to: '/admin/manufacturing', label: 'التصنيع', icon: Hammer, stage: 3 },
  { to: '/admin/transport', label: 'النقل', icon: Truck, stage: 4 },
  { to: '/admin/quality', label: 'مراقبة الجودة', icon: ShieldCheck, stage: 5 },
  { to: '/admin/installation', label: 'التركيب', icon: Wrench, stage: 6 },
  { to: '/admin/delivery', label: 'التسليم النهائي', icon: PackageCheck, stage: 7 },
  { to: '/admin/returns', label: 'المرتجعات', icon: RotateCcw },
  { to: '/admin/employees', label: 'الموظفون', icon: Users },
  { to: '/admin/reports', label: 'التقارير', icon: BarChart3 },
]

export default function AdminLayout() {
  const { db } = useStore()
  const count = (n: typeof NAV[number]) => {
    if (n.stage !== undefined) return db.orders.filter(o => o.stage === n.stage).length
    if (n.to.endsWith('returns')) return db.returns.filter(r => r.status !== 'resolved').length + db.problems.filter(p => !p.resolved).length
    return 0
  }
  return (
    <div className="h-full flex flex-col md:flex-row">
      <aside className="hidden md:flex md:w-[76px] lg:w-64 shrink-0 flex-col bg-white border-s border-line">
        <div className="p-4 lg:p-5 flex items-center gap-3 border-b border-line">
          <div className="w-11 h-11 rounded-xl bg-brand text-white grid place-items-center shrink-0"><Hammer size={22} /></div>
          <div className="hidden lg:block leading-tight"><div className="font-extrabold">ورشة الفولاذ</div><div className="text-xs text-mute">أبو عمر — مدير الورشة</div></div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 lg:p-3 space-y-1">
          {NAV.map(n => {
            const c = count(n)
            return (
              <NavLink key={n.to} to={n.to} end={n.end} title={n.label}
                className={({ isActive }) => `flex items-center gap-3 h-12 px-3 rounded-xl font-bold transition justify-center lg:justify-start ${isActive ? 'bg-brand text-white' : 'text-ink hover:bg-card'}`}>
                <n.icon size={21} className="shrink-0" />
                <span className="hidden lg:inline flex-1">{n.label}</span>
                {c > 0 && <span className="hidden lg:inline text-xs bg-white/90 text-ink rounded-full min-w-6 h-6 px-1.5 grid place-items-center border border-line">{c}</span>}
              </NavLink>
            )
          })}
        </nav>
      </aside>
      <nav className="md:hidden flex gap-1 overflow-x-auto bg-white border-b border-line p-2 shrink-0">
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex items-center gap-2 h-10 px-3 rounded-xl font-bold whitespace-nowrap text-sm ${isActive ? 'bg-brand text-white' : 'bg-card'}`}><n.icon size={16} />{n.label}</NavLink>
        ))}
      </nav>
      <ScrollArea className="flex-1 min-w-0 min-h-0"><main className="p-4 md:p-6 lg:p-8 max-w-[1280px] mx-auto fade-up"><Outlet /></main></ScrollArea>
    </div>
  )
}
