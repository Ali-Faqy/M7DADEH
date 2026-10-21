import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, Search } from 'lucide-react'
import { STAGES } from '../types'
import { orderStatus, stageLabel, useStore } from '../store'
import { fmtDate, fmtMoney } from '../mock'
import { Badge, Card, Empty, PageHeader, inputCls } from '../ui'
import { MiniStepper, Stepper } from '../shared/Stepper'
import { StagePanel } from '../shared/StagePanel'
import { StageMedia } from '../shared/StageMedia'

export function OrdersList() {
  const { db } = useStore()
  const [q, setQ] = useState(''); const [stage, setStage] = useState('all'); const [st, setSt] = useState('all')
  const rows = db.orders.filter(o => {
    const p = db.projects.find(x => x.id === o.projectId)
    const s = orderStatus(o)
    return (o.id + o.title + (p?.name ?? '') + (p?.customer ?? '')).includes(q.trim()) && (stage === 'all' || String(o.stage) === stage) && (st === 'all' || s.label === st)
  })
  return (
    <div className="space-y-5">
      <PageHeader title="الطلبيات" sub="كل الطلبيات في جميع المشاريع ومراحلها الحالية" />
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md"><Search size={18} className="absolute top-3.5 start-3 text-mute" /><input className={`${inputCls} ps-10`} placeholder="ابحث برقم الطلبية أو الاسم أو الزبون…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className={`${inputCls} !w-52`} value={stage} onChange={e => setStage(e.target.value)}>
          <option value="all">كل المراحل</option>{STAGES.map((s, i) => <option key={s.key} value={i}>{s.label}</option>)}<option value="8">مكتملة</option>
        </select>
        <select className={`${inputCls} !w-44`} value={st} onChange={e => setSt(e.target.value)}>
          <option value="all">كل الحالات</option><option>قيد التنفيذ</option><option>متأخرة</option><option>إعادة عمل</option><option>مكتملة</option>
        </select>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? <Empty icon={<Search />} title="لا توجد طلبيات مطابقة" /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[760px]">
            <thead className="bg-card text-mute"><tr><th className="p-3 text-start">الطلبية</th><th className="p-3 text-start">المشروع</th><th className="p-3 text-start">التقدّم</th><th className="p-3 text-start">المرحلة</th><th className="p-3 text-start">التسليم</th><th className="p-3 text-start">الحالة</th></tr></thead>
            <tbody>
              {rows.map(o => { const p = db.projects.find(x => x.id === o.projectId); const s = orderStatus(o); return (
                <tr key={o.id} className="border-t border-line hover:bg-card/50">
                  <td className="p-3"><Link to={`/admin/orders/${o.id}`} className="font-extrabold hover:text-brand">{o.id}</Link><div className="text-mute">{o.title}</div></td>
                  <td className="p-3"><div className="font-bold">{p?.name}</div><div className="text-mute">{p?.customer}</div></td>
                  <td className="p-3"><MiniStepper order={o} /></td>
                  <td className="p-3 font-bold">{stageLabel(o)}</td>
                  <td className="p-3">{fmtDate(o.estDelivery)}</td>
                  <td className="p-3"><Badge tone={s.tone}>{s.label}</Badge></td>
                </tr>) })}
            </tbody></table></div>
        )}
      </Card>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams(); const { db } = useStore()
  const o = db.orders.find(x => x.id === id)
  const [sel, setSel] = useState<number | null>(null)
  if (!o) return <Empty icon={<Search />} title="الطلبية غير موجودة" />
  const p = db.projects.find(x => x.id === o.projectId)
  const s = orderStatus(o)
  const selected = sel ?? Math.min(o.stage, 7)
  const isCurrent = o.stage < 8 && selected === o.stage
  const st = STAGES[selected]
  const activity = db.activity.filter(a => a.orderId === o.id).slice(0, 6)
  return (
    <div className="space-y-6">
      <Link to={`/admin/projects/${o.projectId}`} className="inline-flex items-center gap-1 text-brand font-bold"><ArrowRight size={18} />{p?.name}</Link>
      <PageHeader title={`${o.id} — ${o.title}`} sub={`${p?.customer} · ${p?.location}`} actions={<Badge tone={s.tone} className="!text-base !px-4 !py-2">{s.label}</Badge>} />
      <Card className="p-4 md:p-5"><Stepper order={o} selected={selected} onSelect={i => setSel(i)} /></Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-extrabold">{st.label}</h2>
              <Badge tone={isCurrent ? 'info' : selected < o.stage || o.stage >= 8 ? 'ok' : 'neutral'}>{isCurrent ? 'المرحلة الحالية' : selected < o.stage || o.stage >= 8 ? 'مكتملة' : 'لم تبدأ بعد'}</Badge></div>
            {isCurrent ? <StagePanel order={o} /> : selected < o.stage || o.stage >= 8 ? <p className="text-mute">اكتملت هذه المرحلة. يمكنك مراجعة صورها وملاحظاتها أدناه.</p> : <p className="text-mute">لم تصل الطلبية إلى هذه المرحلة بعد.</p>}
            {o.stage >= 8 && selected === 7 && <div className="mt-4"><StagePanel order={o} /></div>}
          </Card>
          {(selected <= o.stage || o.stage >= 8) && <Card className="p-5"><StageMedia order={o} stage={selected} /></Card>}
        </div>
        <div className="space-y-6">
          <Card className="p-5 space-y-3 text-sm">
            <h3 className="font-extrabold text-lg">تفاصيل الطلبية</h3>
            <p className="text-mute">{o.description || 'لا يوجد وصف.'}</p>
            <div className="flex justify-between"><span className="text-mute">السعر</span><b>{fmtMoney(o.price)}</b></div>
            <div className="flex justify-between"><span className="text-mute">الدفعة المقدّمة</span><b>{fmtMoney(o.deposit)}</b></div>
            <div className="flex justify-between items-center"><span className="text-mute flex items-center gap-1"><CalendarDays size={15} />التسليم المتوقع</span><b>{fmtDate(o.estDelivery)}</b></div>
          </Card>
          <Card className="p-5"><h3 className="font-extrabold text-lg mb-3">سجل الطلبية</h3>
            <div className="space-y-2.5 text-sm">{activity.length === 0 ? <div className="text-mute">لا توجد أحداث بعد.</div> : activity.map(a => <div key={a.id}>• {a.text.replace(o.id + ': ', '')}</div>)}</div></Card>
        </div>
      </div>
    </div>
  )
}
