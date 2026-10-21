import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, MapPin, MessageSquare, Phone, Plus, Search, Send, User } from 'lucide-react'
import { KINDS, type Kind } from '../types'
import { orderProgress, orderStatus, stageLabel, useStore } from '../store'
import { ago, daysFrom, fmtDate, fmtMoney } from '../mock'
import { Badge, Btn, Card, Empty, Field, Modal, PageHeader, ProgressBar, inputCls, useToast } from '../ui'
import { MiniStepper } from '../shared/Stepper'

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProject } = useStore(); const toast = useToast(); const nav = useNavigate()
  const [f, setF] = useState({ name: '', customer: '', phone: '', location: '', estDelivery: daysFrom(30) })
  const ok = f.name.trim() && f.customer.trim() && f.location.trim()
  const submit = () => {
    const id = addProject({ ...f, name: f.name.trim(), customer: f.customer.trim(), location: f.location.trim(), phone: f.phone || '—' })
    toast('تم إنشاء المشروع بنجاح'); onClose(); setF({ name: '', customer: '', phone: '', location: '', estDelivery: daysFrom(30) }); nav(`/admin/projects/${id}`)
  }
  const fill = () => setF({ name: 'مشروع منزل أبو سليم', customer: 'سليم عبد الله', phone: '0599-777-888', location: 'بيت لحم', estDelivery: daysFrom(28) })
  return (
    <Modal open={open} onClose={onClose} title="إنشاء مشروع جديد"
      footer={<><Btn variant="secondary" onClick={onClose}>إلغاء</Btn><Btn disabled={!ok} onClick={submit}>إنشاء المشروع</Btn></>}>
      <button onClick={fill} className="text-sm font-bold text-brand">تعبئة بيانات تجريبية</button>
      <Field label="اسم المشروع"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="مثال: مشروع فيلا خالد" /></Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="اسم الزبون"><input className={inputCls} value={f.customer} onChange={e => setF({ ...f, customer: e.target.value })} /></Field>
        <Field label="رقم الهاتف"><input className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
        <Field label="الموقع"><input className={inputCls} value={f.location} onChange={e => setF({ ...f, location: e.target.value })} placeholder="المدينة / المنطقة" /></Field>
        <Field label="التسليم المتوقع"><input type="date" className={inputCls} value={f.estDelivery} onChange={e => setF({ ...f, estDelivery: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

export function NewOrderModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string }) {
  const { addOrder } = useStore(); const toast = useToast()
  const [f, setF] = useState({ title: '', kind: 'gate' as Kind, description: '', price: '' })
  const submit = () => {
    const id = addOrder(projectId, { title: f.title.trim(), kind: f.kind, description: f.description.trim(), price: +f.price || 0 })
    toast(`تمت إضافة الطلبية ${id}`); onClose(); setF({ title: '', kind: 'gate', description: '', price: '' })
  }
  return (
    <Modal open={open} onClose={onClose} title="إضافة طلبية للمشروع"
      footer={<><Btn variant="secondary" onClick={onClose}>إلغاء</Btn><Btn disabled={!f.title.trim()} onClick={submit}>إضافة الطلبية</Btn></>}>
      <Field label="نوع الطلبية">
        <select className={inputCls} value={f.kind} onChange={e => { const k = e.target.value as Kind; setF({ ...f, kind: k, title: f.title || `تصنيع ${KINDS[k].label}` }) }}>
          {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </Field>
      <Field label="عنوان الطلبية"><input className={inputCls} value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="مثال: تصنيع وتركيب بوابة حديد" /></Field>
      <Field label="الوصف"><textarea className={`${inputCls} h-20 py-2`} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
      <Field label="السعر المتفق عليه (₪)"><input type="number" className={inputCls} value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></Field>
    </Modal>
  )
}

export function ProjectsList() {
  const { db } = useStore()
  const [q, setQ] = useState(''); const [flt, setFlt] = useState<'all' | 'active' | 'done'>('all'); const [open, setOpen] = useState(false)
  const rows = db.projects.map(p => {
    const os = db.orders.filter(o => o.projectId === p.id)
    const prog = os.length ? os.reduce((s, o) => s + orderProgress(o), 0) / os.length : 0
    return { p, os, prog, done: os.length > 0 && os.every(o => o.stage >= 8) }
  }).filter(r => (flt === 'all' || (flt === 'done') === r.done) && (r.p.name + r.p.customer + r.p.location).includes(q.trim()))
  return (
    <div className="space-y-5">
      <PageHeader title="المشاريع" sub="كل مشروع يضم طلبية أو أكثر لنفس الزبون" actions={<Btn icon={<Plus size={18} />} onClick={() => setOpen(true)}>إنشاء مشروع</Btn>} />
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md"><Search size={18} className="absolute top-3.5 start-3 text-mute" /><input className={`${inputCls} ps-10`} placeholder="ابحث باسم المشروع أو الزبون أو المدينة…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="flex gap-1 bg-card rounded-xl p-1">
          {([['all', 'الكل'], ['active', 'قيد التنفيذ'], ['done', 'مكتملة']] as const).map(([k, l]) => <button key={k} onClick={() => setFlt(k)} className={`px-4 h-9 rounded-lg font-bold text-sm ${flt === k ? 'bg-white shadow-sm' : 'text-mute'}`}>{l}</button>)}
        </div>
      </div>
      {rows.length === 0 ? <Card><Empty icon={<Search />} title="لا توجد نتائج" text="جرّب كلمة بحث أخرى" /></Card> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map(({ p, os, prog, done }) => (
            <Link key={p.id} to={`/admin/projects/${p.id}`}><Card className="p-5 hover:shadow-md transition h-full">
              <div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-lg">{p.name}</h3><Badge tone={done ? 'ok' : 'info'}>{done ? 'مكتمل' : 'قيد التنفيذ'}</Badge></div>
              <div className="text-sm text-mute mt-2 space-y-1"><div className="flex items-center gap-2"><User size={15} />{p.customer}</div><div className="flex items-center gap-2"><MapPin size={15} />{p.location}</div></div>
              <div className="mt-4"><div className="flex justify-between text-sm mb-1.5"><span className="font-bold">{os.length} {os.length === 1 ? 'طلبية' : 'طلبيات'}</span><span className="font-bold">{Math.round(prog * 100)}%</span></div><ProgressBar value={prog} /></div>
            </Card></Link>
          ))}
        </div>
      )}
      <NewProjectModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function ProjectDetail() {
  const { id } = useParams(); const { db, addMessage } = useStore(); const toast = useToast()
  const p = db.projects.find(x => x.id === id)
  const [open, setOpen] = useState(false); const [reply, setReply] = useState('')
  if (!p) return <Empty icon={<Search />} title="المشروع غير موجود" />
  const os = db.orders.filter(o => o.projectId === p.id)
  const msgs = db.messages.filter(m => m.projectId === p.id)
  return (
    <div className="space-y-6">
      <Link to="/admin/projects" className="inline-flex items-center gap-1 text-brand font-bold"><ArrowRight size={18} />كل المشاريع</Link>
      <PageHeader title={p.name} actions={<Btn icon={<Plus size={18} />} onClick={() => setOpen(true)}>إضافة طلبية</Btn>} />
      <Card className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <Info icon={<User size={18} />} label="الزبون" v={p.customer} /><Info icon={<Phone size={18} />} label="الهاتف" v={p.phone} />
        <Info icon={<MapPin size={18} />} label="الموقع" v={p.location} /><Info icon={<CalendarDays size={18} />} label="التسليم المتوقع" v={fmtDate(p.estDelivery)} />
      </Card>
      <div>
        <h2 className="font-extrabold text-xl mb-3">الطلبيات ({os.length})</h2>
        {os.length === 0 ? <Card><Empty icon={<Plus />} title="لا توجد طلبيات بعد" text="اضغط «إضافة طلبية» لتبدأ" /></Card> : (
          <div className="space-y-3">
            {os.map(o => { const st = orderStatus(o); return (
              <Link key={o.id} to={`/admin/orders/${o.id}`}><Card className="p-4 hover:shadow-md transition flex flex-wrap items-center gap-4 mb-3">
                <div className="flex-1 min-w-[200px]"><div className="font-extrabold">{o.id} — {o.title}</div><div className="text-sm text-mute">{fmtMoney(o.price)} · التسليم {fmtDate(o.estDelivery)}</div></div>
                <MiniStepper order={o} /><Badge tone="neutral">{stageLabel(o)}</Badge><Badge tone={st.tone}>{st.label}</Badge>
              </Card></Link>) })}
          </div>
        )}
      </div>
      <Card className="p-5">
        <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><MessageSquare size={20} className="text-info" />تواصل مع الزبون</h2>
        <div className="space-y-2 mb-4">
          {msgs.length === 0 && <div className="text-sm text-mute">لا توجد رسائل بعد.</div>}
          {msgs.map(m => (
            <div key={m.id} className={`max-w-[85%] rounded-2xl p-3 ${m.from === 'customer' ? 'bg-info-soft' : 'bg-brand-soft ms-auto'}`}>
              <div className="text-xs font-bold text-mute mb-0.5">{m.from === 'customer' ? p.customer : 'الورشة'}</div>
              {m.image && <img src={m.image} alt="" className="rounded-lg mb-2 max-h-40" />}
              <div>{m.text}</div><div className="text-xs text-mute mt-1">{ago(m.at)}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2"><input className={inputCls} placeholder="اكتب ردًا على الزبون…" value={reply} onChange={e => setReply(e.target.value)} />
          <Btn icon={<Send size={18} />} disabled={!reply.trim()} onClick={() => { addMessage({ projectId: p.id, from: 'workshop', text: reply.trim() }); setReply(''); toast('تم إرسال الرد للزبون') }}>إرسال</Btn></div>
      </Card>
      <NewOrderModal open={open} onClose={() => setOpen(false)} projectId={p.id} />
    </div>
  )
}
const Info = ({ icon, label, v }: { icon: React.ReactNode; label: string; v: string }) =>
  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-card grid place-items-center text-mute">{icon}</div><div><div className="text-mute">{label}</div><div className="font-bold">{v}</div></div></div>
