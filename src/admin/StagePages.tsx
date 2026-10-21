import { Link } from 'react-router-dom'
import { ExternalLink, CheckCircle2, Inbox } from 'lucide-react'
import { STAGES } from '../types'
import { orderStatus, useStore } from '../store'
import { fmtDate } from '../mock'
import { Badge, Card, Empty, PageHeader } from '../ui'
import { StagePanel } from '../shared/StagePanel'
import { StageMedia } from '../shared/StageMedia'
import { stageIcons } from '../shared/Stepper'

const DESCR = [
  'زيارة مواقع الزبائن لمعاينتها وتصويرها قبل البدء.',
  'اعتماد تفاصيل الطلبية والسعر.',
  'تسجيل القياسات الدقيقة لكل قطعة.',
  'تكليف العمال بالمهام ومتابعة الإنجاز.',
  'نقل القطع إلى الورشة أو إلى مصنع خارجي للدهان.',
  'فحص الطلبيات واعتمادها أو إعادتها للتصنيع.',
  'جدولة التركيب في مواقع الزبائن وإتمامه.',
  'إرسال طلب الاستلام للزبون وتأكيد التسليم النهائي.',
]

export default function StagePage({ stage }: { stage: number }) {
  const { db } = useStore()
  const s = STAGES[stage]; const Icon = stageIcons[stage]
  const here = db.orders.filter(o => o.stage === stage)
  const passed = db.orders.filter(o => o.stage > stage)
  return (
    <div className="space-y-6">
      <PageHeader title={s.label} sub={DESCR[stage]} actions={
        <div className="flex gap-3">
          <div className="bg-white border border-line rounded-xl px-4 py-2 text-center"><div className="text-2xl font-extrabold text-brand">{here.length}</div><div className="text-xs text-mute">قيد هذه المرحلة</div></div>
          <div className="bg-white border border-line rounded-xl px-4 py-2 text-center"><div className="text-2xl font-extrabold">{passed.length}</div><div className="text-xs text-mute">أنجزت المرحلة</div></div>
        </div>} />
      {here.length === 0 ? (
        <Card><Empty icon={<Inbox />} title="لا توجد طلبيات في هذه المرحلة حاليًا" text="عندما تنتقل طلبية إلى هنا ستظهر مباشرة." /></Card>
      ) : here.map(o => {
        const p = db.projects.find(x => x.id === o.projectId); const st = orderStatus(o)
        return (
          <Card key={o.id} className="overflow-hidden fade-up">
            <div className="flex flex-wrap items-center gap-3 p-4 md:p-5 bg-card/60 border-b border-line">
              <div className="w-11 h-11 rounded-xl bg-brand text-white grid place-items-center"><Icon size={22} /></div>
              <div className="flex-1 min-w-[200px]"><div className="font-extrabold text-lg">{o.id} — {o.title}</div><div className="text-sm text-mute">{p?.name} · {p?.customer} · {p?.location}</div></div>
              <Badge tone={st.tone}>{st.label}</Badge><span className="text-sm text-mute">التسليم: <b className="text-ink">{fmtDate(o.estDelivery)}</b></span>
              <Link to={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand">فتح الطلبية<ExternalLink size={14} /></Link>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 p-4 md:p-5">
              <div><StagePanel order={o} /></div>
              <div className="lg:border-s lg:border-line lg:ps-6"><StageMedia order={o} stage={stage} /></div>
            </div>
          </Card>
        )
      })}
      {passed.length > 0 && (
        <Card className="p-5">
          <h3 className="font-extrabold mb-3 flex items-center gap-2"><CheckCircle2 size={18} className="text-brand" />طلبيات أنجزت هذه المرحلة</h3>
          <div className="divide-y divide-line">{passed.map(o => <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2.5 hover:text-brand"><span className="font-bold">{o.id} — {o.title}</span><span className="text-sm text-mute">{db.projects.find(x => x.id === o.projectId)?.name}</span></Link>)}</div>
        </Card>
      )}
    </div>
  )
}
