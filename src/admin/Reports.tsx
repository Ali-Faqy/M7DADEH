import { Download, FileSpreadsheet, Printer } from 'lucide-react'
import { STAGES } from '../types'
import { useStore } from '../store'
import { daysFrom, fmtMoney } from '../mock'
import { Btn, Card, PageHeader, useToast } from '../ui'

const MONTHS = [['أيار', 4], ['حزيران', 6], ['تموز', 5], ['آب', 8], ['أيلول', 7]] as const

export default function Reports() {
  const { db } = useStore(); const toast = useToast()
  const active = db.orders.filter(o => o.stage < 8)
  const done = db.orders.length - active.length
  const monthly = [...MONTHS.map(([m, n]) => [m, n] as [string, number]), ['تشرين الأول', done + 3] as [string, number]]
  const mmax = Math.max(...monthly.map(m => m[1]))
  const byStage = STAGES.map((s, i) => ({ l: s.label, n: active.filter(o => o.stage === i).length }))
  const smax = Math.max(1, ...byStage.map(b => b.n))
  const late = active.filter(o => o.estDelivery < daysFrom(0)).length
  const workers = db.employees.filter(e => ['welder', 'cutter', 'painter'].includes(e.role)).map(e => ({ e, done: db.tasks.filter(t => t.workerId === e.id && t.status === 'done').length + 6, open: db.tasks.filter(t => t.workerId === e.id && t.status !== 'done').length }))
  const wmax = Math.max(...workers.map(w => w.done))
  const revenue = db.orders.reduce((s, o) => s + o.price, 0)
  const exp = (what: string) => toast(`تم تجهيز ${what} (محاكاة)`, 'info')
  return (
    <div className="space-y-6">
      <PageHeader title="التقارير" sub="ملخص الأداء والإنتاج في الورشة" actions={<>
        <Btn variant="secondary" icon={<Printer size={18} />} onClick={() => exp('نسخة للطباعة')}>طباعة</Btn>
        <Btn variant="secondary" icon={<FileSpreadsheet size={18} />} onClick={() => exp('ملف Excel')}>تصدير Excel</Btn>
        <Btn icon={<Download size={18} />} onClick={() => exp('ملف PDF')}>تصدير PDF</Btn></>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['إجمالي قيمة الطلبيات', fmtMoney(revenue)], ['طلبيات مكتملة', String(done)], ['قيد التنفيذ', String(active.length)], ['طلبيات متأخرة', String(late)]].map(([l, v]) => <Card key={l} className="p-4"><div className="text-mute font-bold text-sm">{l}</div><div className="text-2xl font-extrabold mt-1">{v}</div></Card>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5"><h2 className="font-extrabold text-lg mb-4">الطلبيات المنجزة شهريًا</h2>
          <div className="flex items-end gap-3 h-56">{monthly.map(([m, n]) => (
            <div key={m} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"><span className="font-extrabold">{n}</span><div className="w-full bg-brand/85 rounded-t-lg" style={{ height: `${(n / mmax) * 85}%` }} /><span className="text-xs text-mute text-center">{m}</span></div>))}</div></Card>
        <Card className="p-5"><h2 className="font-extrabold text-lg mb-4">الطلبيات الجارية حسب المرحلة</h2>
          <div className="space-y-2.5">{byStage.map(b => <div key={b.l} className="flex items-center gap-3"><span className="w-32 text-sm font-bold">{b.l}</span><div className="flex-1 h-6 bg-card rounded-md overflow-hidden"><div className="h-full bg-info/80 rounded-md" style={{ width: `${(b.n / smax) * 100}%`, minWidth: b.n ? 20 : 0 }} /></div><span className="w-5 font-extrabold">{b.n}</span></div>)}</div></Card>
      </div>
      <Card className="p-5"><h2 className="font-extrabold text-lg mb-4">إنتاجية العمال (المهام المنجزة هذا الشهر)</h2>
        <div className="space-y-3">{workers.map(({ e, done, open }) => <div key={e.id} className="flex items-center gap-3"><span className="w-36 font-bold">{e.name}</span><div className="flex-1 h-7 bg-card rounded-lg overflow-hidden"><div className="h-full bg-brand rounded-lg" style={{ width: `${(done / wmax) * 100}%` }} /></div><span className="w-24 text-sm"><b>{done}</b> منجزة · {open} جارية</span></div>)}</div></Card>
    </div>
  )
}
