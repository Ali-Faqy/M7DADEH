import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, PlayCircle, Plus, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { ago } from '../mock'
import { Badge, Btn, Card, Empty, PageHeader, useToast } from '../ui'
import { ReturnModal } from '../shared/ReturnModal'

const st = { open: { l: 'مفتوح', t: 'bad' }, inprogress: { l: 'قيد المعالجة', t: 'warn' }, resolved: { l: 'تم الحل', t: 'ok' } } as const
const src = { admin: 'من الإدارة', customer: 'من الزبون', quality: 'من الجودة' }

export default function Returns() {
  const { db, setReturnStatus, resolveProblem } = useStore(); const toast = useToast()
  const [open, setOpen] = useState(false)
  const probs = db.problems
  return (
    <div className="space-y-6">
      <PageHeader title="المرتجعات وإعادة العمل" sub="طلبات الزبائن والجودة التي تحتاج إصلاحًا، وبلاغات العمال"
        actions={<Btn variant="warn" icon={<Plus size={18} />} onClick={() => setOpen(true)}>إنشاء طلب مرتجع</Btn>} />
      <div className="grid grid-cols-3 gap-3">
        {(['open', 'inprogress', 'resolved'] as const).map(k => (
          <Card key={k} className="p-4 text-center"><div className="text-3xl font-extrabold">{db.returns.filter(r => r.status === k).length}</div><div className="text-mute font-bold">{st[k].l}</div></Card>
        ))}
      </div>
      <div className="space-y-3">
        {db.returns.length === 0 && <Card><Empty icon={<RotateCcw />} title="لا توجد طلبات" /></Card>}
        {db.returns.map(r => {
          const o = db.orders.find(x => x.id === r.orderId)
          return (
            <Card key={r.id} className="p-4 md:p-5 fade-up">
              <div className="flex flex-wrap items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-warn-soft text-warn grid place-items-center"><RotateCcw size={22} /></div>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-2"><Link to={`/admin/orders/${r.orderId}`} className="font-extrabold hover:text-brand">{r.orderId} — {o?.title}</Link>
                    <Badge tone={st[r.status].t}>{st[r.status].l}</Badge><Badge>{r.type === 'return' ? 'مرتجع' : 'إعادة عمل'}</Badge><Badge tone="info">{src[r.source]}</Badge></div>
                  <p className="mt-1.5">{r.reason}</p><div className="text-xs text-mute mt-1">{ago(r.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  {r.status === 'open' && <Btn size="sm" variant="secondary" icon={<PlayCircle size={16} />} onClick={() => { setReturnStatus(r.id, 'inprogress'); toast('بدأت معالجة الطلب', 'info') }}>بدء المعالجة</Btn>}
                  {r.status !== 'resolved' && <Btn size="sm" icon={<CheckCircle2 size={16} />} onClick={() => { setReturnStatus(r.id, 'resolved'); toast('تم حل الطلب') }}>تم الحل</Btn>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <div>
        <h2 className="font-extrabold text-xl mb-3 flex items-center gap-2"><AlertTriangle className="text-warn" size={22} />بلاغات العمال</h2>
        <Card className="divide-y divide-line">
          {probs.length === 0 && <Empty icon={<CheckCircle2 />} title="لا توجد بلاغات" />}
          {probs.map(p => (
            <div key={p.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]"><div className="font-bold">{p.orderId} — {p.kind}</div><div className="text-sm">{p.text || 'بدون تفاصيل'}</div><div className="text-xs text-mute">{p.by} · {ago(p.at)}</div></div>
              {p.resolved ? <Badge tone="ok">تم الحل</Badge> : <Btn size="sm" onClick={() => { resolveProblem(p.id); toast('تم تسجيل حل المشكلة') }}>تم الحل</Btn>}
            </div>
          ))}
        </Card>
      </div>
      <ReturnModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
