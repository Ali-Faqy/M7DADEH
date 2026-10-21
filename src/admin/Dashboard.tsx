import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Clock, FolderKanban, Hammer, MessageSquare, Plus, RotateCcw, TrendingUp } from 'lucide-react'
import { STAGES } from '../types'
import { orderStatus, useStore } from '../store'
import { ago, daysFrom, fmtDate, fmtMoney } from '../mock'
import { Badge, Btn, Card, PageHeader, useToast } from '../ui'
import { MiniStepper } from '../shared/Stepper'
import { useState } from 'react'
import { NewProjectModal } from './Projects'

export default function Dashboard() {
  const { db, resolveProblem } = useStore()
  const toast = useToast()
  const [np, setNp] = useState(false)
  const active = db.orders.filter(o => o.stage < 8)
  const late = active.filter(o => o.estDelivery < daysFrom(0))
  const openProblems = db.problems.filter(p => !p.resolved)
  const rework = active.filter(o => o.rework)
  const activeProjects = db.projects.filter(p => db.orders.some(o => o.projectId === p.id && o.stage < 8))
  const value = active.reduce((s, o) => s + o.price, 0)
  const byStage = STAGES.map((s, i) => ({ ...s, n: active.filter(o => o.stage === i).length }))
  const max = Math.max(1, ...byStage.map(b => b.n))
  const msgs = db.messages.filter(m => m.from === 'customer').slice(-3).reverse()
  const hour = new Date().getHours()

  const stats = [
    { label: 'مشاريع نشطة', val: activeProjects.length, icon: FolderKanban, tone: 'text-brand', bg: 'bg-brand-soft', to: '/admin/projects' },
    { label: 'طلبيات قيد التنفيذ', val: active.length, icon: Hammer, tone: 'text-info', bg: 'bg-info-soft', to: '/admin/orders' },
    { label: 'طلبيات متأخرة', val: late.length, icon: Clock, tone: 'text-bad', bg: 'bg-bad-soft', to: '/admin/orders' },
    { label: 'إعادة عمل ومشاكل', val: rework.length + openProblems.length, icon: AlertTriangle, tone: 'text-warn', bg: 'bg-warn-soft', to: '/admin/returns' },
  ]
  const done = db.orders.length - active.length
  const onTime = Math.round(((active.length - late.length + done) / db.orders.length) * 100)

  return (
    <div className="space-y-6">
      <PageHeader title={`${hour < 12 ? 'صباح الخير' : 'مساء الخير'} يا أبا عمر`} sub="هذه نظرة سريعة على ما يجري في الورشة اليوم"
        actions={<Btn icon={<Plus size={18} />} onClick={() => setNp(true)}>إنشاء مشروع</Btn>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} to={s.to}><Card className="p-4 lg:p-5 hover:shadow-md transition">
            <div className={`w-11 h-11 rounded-xl grid place-items-center ${s.bg} ${s.tone} mb-3`}><s.icon size={22} /></div>
            <div className="text-3xl font-extrabold">{s.val}</div><div className="text-mute font-bold">{s.label}</div>
          </Card></Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-extrabold text-lg">الطلبيات حسب المرحلة</h2><span className="text-sm text-mute">اضغط على مرحلة لفتحها</span></div>
          <div className="space-y-2.5">
            {byStage.map(b => (
              <Link key={b.key} to={`/admin/${b.path}`} className="flex items-center gap-3 group">
                <span className="w-32 shrink-0 text-sm font-bold group-hover:text-brand">{b.label}</span>
                <div className="flex-1 h-8 bg-card rounded-lg overflow-hidden"><div className="h-full bg-brand/80 group-hover:bg-brand rounded-lg transition-all" style={{ width: `${(b.n / max) * 100}%`, minWidth: b.n ? 28 : 0 }} /></div>
                <span className="w-6 text-center font-extrabold">{b.n}</span>
              </Link>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-line flex flex-wrap gap-6 text-sm">
            <div><div className="text-mute">قيمة الطلبيات الجارية</div><div className="text-xl font-extrabold">{fmtMoney(value)}</div></div>
            <div><div className="text-mute">طلبيات مكتملة</div><div className="text-xl font-extrabold">{done}</div></div>
            <div className="flex items-center gap-3"><Donut pct={onTime} /><div><div className="text-mute">الالتزام بالمواعيد</div><div className="text-xl font-extrabold">{onTime}%</div></div></div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="text-warn" size={20} />تحتاج انتباهك</h2>
          <div className="space-y-3">
            {openProblems.map(p => (
              <div key={p.id} className="bg-warn-soft rounded-xl p-3">
                <div className="font-bold text-sm">{p.orderId} — {p.kind}</div><div className="text-sm">{p.text}</div>
                <div className="flex items-center justify-between mt-2"><span className="text-xs text-mute">{p.by} · {ago(p.at)}</span><Btn size="sm" variant="secondary" onClick={() => { resolveProblem(p.id); toast('تم تسجيل حل المشكلة') }}>تم الحل</Btn></div>
              </div>
            ))}
            {rework.map(o => <Link key={o.id} to={`/admin/orders/${o.id}`} className="block bg-bad-soft rounded-xl p-3"><div className="font-bold text-sm flex items-center gap-1"><RotateCcw size={14} />{o.id} — إعادة عمل</div><div className="text-sm">{o.rework?.reason}</div></Link>)}
            {late.filter(o => !o.rework).map(o => <Link key={o.id} to={`/admin/orders/${o.id}`} className="block bg-bad-soft rounded-xl p-3"><div className="font-bold text-sm">{o.id} — متأخرة</div><div className="text-sm">{o.title}</div></Link>)}
            {openProblems.length + rework.length + late.length === 0 && <div className="text-sm text-mute text-center py-6">لا توجد تنبيهات — كل شيء يسير جيدًا</div>}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-extrabold text-lg">أقرب تسليمات</h2><Link to="/admin/orders" className="text-sm font-bold text-brand inline-flex items-center gap-1">كل الطلبيات<ArrowLeft size={14} /></Link></div>
          <div className="divide-y divide-line">
            {[...active].sort((a, b) => a.estDelivery.localeCompare(b.estDelivery)).slice(0, 5).map(o => {
              const st = orderStatus(o); const p = db.projects.find(x => x.id === o.projectId)
              return (
                <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:bg-card/50 -mx-2 px-2 rounded-lg">
                  <div className="flex-1 min-w-[180px]"><div className="font-bold">{o.id} — {o.title}</div><div className="text-sm text-mute">{p?.name}</div></div>
                  <MiniStepper order={o} />
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <span className="text-sm font-bold w-20 text-end">{fmtDate(o.estDelivery)}</span>
                </Link>
              )
            })}
          </div>
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><MessageSquare size={20} className="text-info" />رسائل الزبائن</h2>
            <div className="space-y-2">{msgs.map(m => { const p = db.projects.find(x => x.id === m.projectId); return <Link key={m.id} to={`/admin/projects/${m.projectId}`} className="block bg-info-soft/60 rounded-xl p-3"><div className="text-sm font-bold">{p?.customer} · {p?.name}</div><div className="text-sm">{m.text}</div><div className="text-xs text-mute mt-1">{ago(m.at)}</div></Link> })}</div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><TrendingUp size={20} className="text-brand" />آخر النشاطات</h2>
            <div className="space-y-3">
              {db.activity.slice(0, 6).map(a => (
                <div key={a.id} className="flex gap-2.5 text-sm"><span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${a.tone === 'ok' ? 'bg-brand' : a.tone === 'bad' ? 'bg-bad' : a.tone === 'warn' ? 'bg-warn' : 'bg-info'}`} /><div><div>{a.text}</div><div className="text-xs text-mute">{ago(a.at)}</div></div></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <NewProjectModal open={np} onClose={() => setNp(false)} />
    </div>
  )
}

function Donut({ pct }: { pct: number }) {
  const r = 20, c = 2 * Math.PI * r
  return (
    <svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r={r} fill="none" stroke="#f1eee8" strokeWidth="7" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#4a6b57" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 26 26)" /></svg>
  )
}
