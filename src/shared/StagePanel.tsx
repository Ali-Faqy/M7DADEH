import { useState } from 'react'
import { ArrowLeft, Building2, CalendarDays, Check, CheckCircle2, Factory, Plus, RotateCcw, Send, ThumbsDown, ThumbsUp, Trash2, Truck, UserCheck } from 'lucide-react'
import { KINDS, QUALITY_CHECKS, STAGES, type EmpRole, type Order, type Task } from '../types'
import { useStore } from '../store'
import { fmtDate, fmtMoney } from '../mock'
import { Badge, Btn, Field, Modal, inputCls, useToast } from '../ui'
import { ReturnModal } from './ReturnModal'

export function EmpSelect({ role, value, onChange, placeholder = 'اختر موظفًا', className = '' }: { role?: EmpRole | EmpRole[]; value: string | null; onChange: (v: string | null) => void; placeholder?: string; className?: string }) {
  const { db } = useStore()
  const roles = role ? (Array.isArray(role) ? role : [role]) : null
  const list = db.employees.filter(e => e.active && (!roles || roles.includes(e.role)))
  return (
    <select className={`${inputCls} ${className}`} value={value ?? ''} onChange={e => onChange(e.target.value || null)}>
      <option value="">{placeholder}</option>
      {list.map(e => <option key={e.id} value={e.id}>{e.name} — {e.roleLabel}</option>)}
    </select>
  )
}

const Hint = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-mute">{children}</p>
const Row = ({ children }: { children: React.ReactNode }) => <div className="grid sm:grid-cols-2 gap-4">{children}</div>

export function StagePanel({ order }: { order: Order }) {
  const stage = STAGES[order.stage]
  if (!stage) return <CompleteBlock order={order} />
  switch (stage.key) {
    case 'survey': return <SurveyPanel order={order} />
    case 'order': return <OrderPanel order={order} />
    case 'measurements': return <MeasurePanel order={order} />
    case 'manufacturing': return <ManufPanel order={order} />
    case 'transport': return <TransportPanel order={order} />
    case 'quality': return <QualityPanel order={order} />
    case 'installation': return <InstallPanel order={order} />
    case 'delivery': return <DeliveryPanel order={order} />
  }
}

function Reworked({ order }: { order: Order }) {
  if (!order.rework) return null
  return (
    <div className="flex items-start gap-3 bg-warn-soft border border-warn/40 rounded-xl p-3">
      <RotateCcw className="text-warn shrink-0 mt-0.5" size={20} />
      <div><div className="font-extrabold text-[#a85f14]">هذه الطلبية في إعادة عمل</div><div className="text-sm">{order.rework.reason}</div></div>
    </div>
  )
}

/* ---- survey ---- */
function SurveyPanel({ order }: { order: Order }) {
  const { updateOrder, advanceOrder, db } = useStore(); const toast = useToast()
  const p = db.projects.find(x => x.id === order.projectId)
  return (
    <div className="space-y-4">
      <Hint>زيارة الموقع لمعاينة المكان وتصويره قبل البدء. الموقع: <b className="text-ink">{p?.location}</b> — الزبون: <b className="text-ink">{p?.customer}</b></Hint>
      <Row>
        <Field label="موعد الزيارة"><input type="date" className={inputCls} value={order.surveyDate} onChange={e => updateOrder(order.id, { surveyDate: e.target.value })} /></Field>
        <Field label="المسؤول عن المسح"><EmpSelect role="surveyor" value={order.surveyorId} onChange={v => updateOrder(order.id, { surveyorId: v })} /></Field>
      </Row>
      <Btn icon={<Check size={18} />} onClick={() => { advanceOrder(order.id); toast('تم إنهاء المسح الميداني والانتقال لاعتماد الطلبية') }}>إنهاء المسح الميداني</Btn>
    </div>
  )
}

/* ---- order ---- */
function OrderPanel({ order }: { order: Order }) {
  const { updateOrder, advanceOrder } = useStore(); const toast = useToast()
  return (
    <div className="space-y-4">
      <Hint>راجع تفاصيل الطلبية والسعر مع الزبون ثم اعتمدها لتنتقل إلى القياسات.</Hint>
      <Field label="وصف الطلبية"><textarea className={`${inputCls} h-24 py-2`} value={order.description} onChange={e => updateOrder(order.id, { description: e.target.value })} /></Field>
      <Row>
        <Field label="السعر (₪)"><input type="number" className={inputCls} value={order.price} onChange={e => updateOrder(order.id, { price: +e.target.value })} /></Field>
        <Field label="الدفعة المقدّمة (₪)"><input type="number" className={inputCls} value={order.deposit} onChange={e => updateOrder(order.id, { deposit: +e.target.value })} /></Field>
      </Row>
      <Row>
        <Field label="تاريخ التسليم المتوقع"><input type="date" className={inputCls} value={order.estDelivery} onChange={e => updateOrder(order.id, { estDelivery: e.target.value })} /></Field>
        <Field label="المتبقي على الزبون"><div className="h-11 px-3 rounded-xl bg-card flex items-center font-bold">{fmtMoney(Math.max(0, order.price - order.deposit))}</div></Field>
      </Row>
      <Btn icon={<Check size={18} />} onClick={() => { advanceOrder(order.id); toast('تم اعتماد الطلبية') }}>اعتماد الطلبية</Btn>
    </div>
  )
}

/* ---- measurements ---- */
function MeasurePanel({ order }: { order: Order }) {
  const { updateOrder, advanceOrder } = useStore(); const toast = useToast()
  const [item, setItem] = useState(''); const [w, setW] = useState(''); const [h, setH] = useState(''); const [q, setQ] = useState('1')
  const add = () => {
    if (!item.trim() || !+w || !+h) return
    updateOrder(order.id, { measures: [...order.measures, { id: Math.random().toString(36).slice(2), item: item.trim(), w: +w, h: +h, qty: +q || 1 }] })
    setItem(''); setW(''); setH(''); setQ('1'); toast('تمت إضافة القياس')
  }
  return (
    <div className="space-y-4">
      <Reworked order={order} />
      <Hint>سجّل قياسات كل قطعة بالسنتيمتر بعد الزيارة الميدانية.</Hint>
      <div className="rounded-xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card text-mute"><tr><th className="p-2.5 text-start">البند</th><th className="p-2.5">العرض (سم)</th><th className="p-2.5">الارتفاع (سم)</th><th className="p-2.5">العدد</th><th className="w-10" /></tr></thead>
          <tbody>
            {order.measures.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-mute">لا توجد قياسات بعد</td></tr>}
            {order.measures.map(m => (
              <tr key={m.id} className="border-t border-line text-center">
                <td className="p-2.5 text-start font-bold">{m.item}</td><td>{m.w}</td><td>{m.h}</td><td>{m.qty}</td>
                <td><button aria-label="حذف" onClick={() => updateOrder(order.id, { measures: order.measures.filter(x => x.id !== m.id) })} className="p-2 text-mute hover:text-bad"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_.7fr_auto] gap-2 items-end">
        <div className="col-span-2 sm:col-span-1"><Field label="البند"><input className={inputCls} value={item} onChange={e => setItem(e.target.value)} placeholder="مثال: جناح البوابة" /></Field></div>
        <Field label="العرض"><input type="number" className={inputCls} value={w} onChange={e => setW(e.target.value)} /></Field>
        <Field label="الارتفاع"><input type="number" className={inputCls} value={h} onChange={e => setH(e.target.value)} /></Field>
        <Field label="العدد"><input type="number" className={inputCls} value={q} onChange={e => setQ(e.target.value)} /></Field>
        <Btn variant="secondary" icon={<Plus size={18} />} onClick={add} disabled={!item.trim() || !+w || !+h} className="col-span-2 sm:col-span-1">إضافة</Btn>
      </div>
      <Btn icon={<Check size={18} />} disabled={order.measures.length === 0} onClick={() => { advanceOrder(order.id); toast('تم اعتماد القياسات وبدء التصنيع') }}>اعتماد القياسات</Btn>
    </div>
  )
}

/* ---- manufacturing ---- */
const taskTone = { todo: 'neutral', doing: 'info', done: 'ok' } as const
const taskLabel = { todo: 'لم تبدأ', doing: 'قيد العمل', done: 'مكتملة' }
function ManufPanel({ order }: { order: Order }) {
  const { db, assignTask, setTaskStatus, addTask, advanceOrder } = useStore(); const toast = useToast()
  const tasks = db.tasks.filter(t => t.orderId === order.id && t.stage === 'manufacturing')
  const [title, setTitle] = useState('')
  const left = tasks.filter(t => t.status !== 'done').length
  return (
    <div className="space-y-4">
      <Reworked order={order} />
      <Hint>كلّف العمال بالمهام وتابع تقدّمهم. يستطيع العامل رؤية مهامه وتحديثها من تطبيق العمال.</Hint>
      <div className="space-y-2">
        {tasks.map((t: Task) => (
          <div key={t.id} className="flex flex-wrap items-center gap-2 bg-card/70 rounded-xl p-3">
            <div className="flex-1 min-w-[160px]"><div className="font-bold">{t.title}</div>{t.urgent && <Badge tone="bad">عاجلة</Badge>}</div>
            <div className="w-44"><EmpSelect value={t.workerId} onChange={v => { assignTask(t.id, v); if (v) toast('تم تكليف الموظف بالمهمة') }} placeholder="تعيين عامل" className="!h-10 !text-sm" /></div>
            <select className={`${inputCls} !w-32 !h-10 !text-sm`} value={t.status} onChange={e => setTaskStatus(t.id, e.target.value as Task['status'])}>
              {Object.entries(taskLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Badge tone={taskTone[t.status]}>{taskLabel[t.status]}</Badge>
          </div>
        ))}
        {tasks.length === 0 && <div className="text-sm text-mute">لا توجد مهام بعد.</div>}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="إضافة مهمة جديدة…" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && title.trim()) { addTask(order.id, title.trim()); setTitle('') } }} />
        <Btn variant="secondary" icon={<Plus size={18} />} disabled={!title.trim()} onClick={() => { addTask(order.id, title.trim()); setTitle(''); toast('تمت إضافة المهمة') }}>إضافة مهمة</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Btn icon={<Check size={18} />} disabled={tasks.length === 0 || left > 0} onClick={() => { advanceOrder(order.id); toast('اكتمل التصنيع — الطلبية جاهزة للنقل') }}>إنهاء التصنيع</Btn>
        {left > 0 && <span className="text-sm text-warn font-bold">بقي {left} {left === 1 ? 'مهمة' : 'مهام'} غير مكتملة</span>}
      </div>
    </div>
  )
}

/* ---- transport ---- */
const FACTORIES = ['مصنع الأفق للدهان الإلكتروستاتيكي — نابلس', 'مصنع النور للتشطيب والدهان — الخليل']
function TransportPanel({ order }: { order: Order }) {
  const { updateOrder, advanceOrder, db } = useStore(); const toast = useToast()
  const t = order.transport
  const set = (patch: Partial<Order['transport']>) => updateOrder(order.id, { transport: { ...t, ...patch } })
  const driver = db.employees.find(e => e.id === t.driverId)
  const destLabel = t.dest === 'factory' ? (t.factory || 'مصنع خارجي') : 'الورشة الرئيسية'
  if (t.status === 'transit') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-info-soft p-5 text-center">
          <Truck size={48} className="mx-auto text-info drive" />
          <div className="font-extrabold text-lg mt-2">القطع في الطريق إلى: {destLabel}</div>
          <div className="text-sm text-mute mt-1">السائق: {driver?.name ?? '—'} · {t.vehicle}</div>
        </div>
        <Btn icon={<Check size={18} />} onClick={() => { set({ status: 'arrived' }); advanceOrder(order.id); toast('تم تأكيد الوصول — الطلبية الآن في مراقبة الجودة') }}>تأكيد الوصول</Btn>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <Hint>اختر وجهة النقل: إلى الورشة الرئيسية أو إلى مصنع خارجي للدهان والتشطيب.</Hint>
      <div className="grid sm:grid-cols-2 gap-3">
        {([['workshop', 'الورشة الرئيسية', Building2], ['factory', 'مصنع خارجي', Factory]] as const).map(([v, l, Icon]) => (
          <button key={v} onClick={() => set({ dest: v, factory: v === 'factory' ? (t.factory || FACTORIES[0]) : '' })}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-start ${t.dest === v ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:bg-card'}`}>
            <Icon size={28} className="text-brand" /><div className="font-extrabold">{l}</div>
          </button>
        ))}
      </div>
      {t.dest === 'factory' && <Field label="المصنع"><select className={inputCls} value={t.factory} onChange={e => set({ factory: e.target.value })}>{FACTORIES.map(f => <option key={f}>{f}</option>)}</select></Field>}
      <Row>
        <Field label="السائق"><EmpSelect role="driver" value={t.driverId} onChange={v => set({ driverId: v })} /></Field>
        <Field label="المركبة"><select className={inputCls} value={t.vehicle} onChange={e => set({ vehicle: e.target.value })}><option>شاحنة صغيرة — 4 طن</option><option>شاحنة كبيرة — 10 طن</option></select></Field>
      </Row>
      <Btn icon={<Truck size={18} />} disabled={!t.driverId} onClick={() => { set({ status: 'transit' }); toast('بدأ النقل إلى ' + destLabel, 'info') }}>بدء النقل</Btn>
    </div>
  )
}

/* ---- quality ---- */
function QualityPanel({ order }: { order: Order }) {
  const { updateOrder, approveQuality, rejectQuality, db } = useStore(); const toast = useToast()
  const [rej, setRej] = useState(false); const [reason, setReason] = useState('')
  const q = order.quality
  const all = q.checks.every(Boolean)
  const setChecks = (checks: boolean[]) => updateOrder(order.id, { quality: { ...q, checks } })
  const inspector = db.employees.find(e => e.role === 'qc')
  const reasons = ['لحام غير متين', 'أبعاد غير مطابقة', 'دهان غير متساوٍ', 'حواف حادة تحتاج تنعيم']
  return (
    <div className="space-y-4">
      <Hint>المفتش: <b className="text-ink">{inspector?.name}</b> — افحص كل بند ثم اعتمد الجودة أو ارفضها.</Hint>
      <div className="space-y-2">
        {QUALITY_CHECKS.map((c, i) => (
          <label key={c} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${q.checks[i] ? 'bg-brand-soft/60 border-brand/30' : 'bg-white border-line'}`}>
            <input type="checkbox" className="w-5 h-5 accent-[#4a6b57]" checked={q.checks[i]} onChange={e => setChecks(q.checks.map((v, j) => j === i ? e.target.checked : v))} />
            <span className="font-bold">{c}</span>
          </label>
        ))}
        <button className="text-sm font-bold text-brand" onClick={() => setChecks(q.checks.map(() => !all))}>{all ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn icon={<ThumbsUp size={18} />} disabled={!all} onClick={() => { approveQuality(order.id); toast('تم اعتماد الجودة — الطلبية جاهزة للتركيب') }}>اعتماد الجودة</Btn>
        <Btn variant="danger" icon={<ThumbsDown size={18} />} onClick={() => { setRej(true); setReason('') }}>رفض وإعادة للتصنيع</Btn>
      </div>
      {!all && <Hint>حدّد جميع البنود لتفعيل «اعتماد الجودة».</Hint>}
      <Modal open={rej} onClose={() => setRej(false)} title="رفض الجودة"
        footer={<><Btn variant="secondary" onClick={() => setRej(false)}>رجوع</Btn><Btn variant="danger" disabled={!reason.trim()} onClick={() => { rejectQuality(order.id, reason.trim()); setRej(false); toast('تم الرفض وإعادة الطلبية للتصنيع', 'bad') }}>تأكيد الرفض</Btn></>}>
        <div className="flex flex-wrap gap-2">{reasons.map(r => <button key={r} onClick={() => setReason(r)} className={`px-3 py-2 rounded-full text-sm font-bold border ${reason === r ? 'bg-bad text-white border-bad' : 'bg-white border-line'}`}>{r}</button>)}</div>
        <Field label="سبب الرفض"><textarea className={`${inputCls} h-24 py-2`} value={reason} onChange={e => setReason(e.target.value)} placeholder="اشرح ما يجب إصلاحه…" /></Field>
        <Hint>سيتم إنشاء مهمة إعادة عمل عاجلة للعامل تلقائيًا.</Hint>
      </Modal>
    </div>
  )
}

/* ---- installation ---- */
function InstallPanel({ order }: { order: Order }) {
  const { updateOrder, advanceOrder } = useStore(); const toast = useToast()
  return (
    <div className="space-y-4">
      <Reworked order={order} />
      <Hint>حدّد موعد التركيب في موقع الزبون والفريق المسؤول.</Hint>
      <Row>
        <Field label="موعد التركيب" hint={order.install.date ? fmtDate(order.install.date) : undefined}><input type="date" className={inputCls} value={order.install.date} onChange={e => updateOrder(order.id, { install: { ...order.install, date: e.target.value } })} /></Field>
        <Field label="رئيس الفريق"><EmpSelect role="installer" value={order.install.teamId} onChange={v => updateOrder(order.id, { install: { ...order.install, teamId: v } })} /></Field>
      </Row>
      <div className="flex items-center gap-2 text-sm bg-info-soft rounded-xl p-3"><CalendarDays size={18} className="text-info" />الموقع: {KINDS[order.kind].label} — سيتم إخطار الزبون بالموعد.</div>
      <Btn icon={<Check size={18} />} disabled={!order.install.date || !order.install.teamId} onClick={() => { advanceOrder(order.id); toast('تم إتمام التركيب بنجاح') }}>إتمام التركيب</Btn>
    </div>
  )
}

/* ---- delivery ---- */
function DeliveryPanel({ order }: { order: Order }) {
  const { updateOrder, customerAccept } = useStore(); const toast = useToast()
  const s = order.delivery.status
  const [ret, setRet] = useState(false)
  return (
    <div className="space-y-4">
      {s === 'pending' && <>
        <Hint>التركيب انتهى. أرسل طلب الاستلام للزبون ليؤكد استلام الطلبية من بوابة الزبائن.</Hint>
        <Btn icon={<Send size={18} />} onClick={() => { updateOrder(order.id, { delivery: { status: 'awaiting' } }); toast('تم إرسال طلب الاستلام للزبون') }}>إرسال طلب الاستلام للزبون</Btn>
      </>}
      {s === 'awaiting' && <>
        <div className="rounded-2xl bg-warn-soft p-4 flex items-center gap-3"><UserCheck className="text-warn" size={28} /><div><div className="font-extrabold">بانتظار موافقة الزبون</div><div className="text-sm text-mute">يمكنه القبول من بوابة الزبائن، أو سجّل القبول بنفسك بعد التسليم الورقي.</div></div></div>
        <Btn icon={<CheckCircle2 size={18} />} onClick={() => { customerAccept(order.id); toast('تم تأكيد التسليم النهائي') }}>تأكيد التسليم النهائي</Btn>
      </>}
      {s === 'issue' && <>
        <div className="rounded-2xl bg-bad-soft p-4"><div className="font-extrabold text-bad">أبلغ الزبون عن مشكلة</div><div className="text-sm">راجع طلب المرتجع في صفحة «المرتجعات».</div></div>
        <Btn variant="warn" icon={<RotateCcw size={18} />} onClick={() => setRet(true)}>إنشاء إعادة عمل</Btn>
      </>}
      <ReturnModal open={ret} onClose={() => setRet(false)} orderId={order.id} />
    </div>
  )
}

function CompleteBlock({ order }: { order: Order }) {
  const [ret, setRet] = useState(false)
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-brand-soft p-5 text-center"><CheckCircle2 size={44} className="mx-auto text-brand" /><div className="font-extrabold text-xl mt-2">تم التسليم النهائي</div><div className="text-sm text-mute">اكتملت جميع مراحل الطلبية {order.id} وقبل الزبون الاستلام.</div></div>
      <Btn variant="secondary" icon={<ArrowLeft size={18} className="rotate-180" />} onClick={() => setRet(true)}>إنشاء طلب مرتجع / إعادة عمل</Btn>
      <ReturnModal open={ret} onClose={() => setRet(false)} orderId={order.id} />
    </div>
  )
}
