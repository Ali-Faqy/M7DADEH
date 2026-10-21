import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Camera, Check, CheckCircle2, ChevronLeft, Hammer, Home, Image as ImageIcon, ImagePlus, MessageSquare, PackageCheck, Send, Star, Truck, X } from 'lucide-react'
import { CUSTOMER_NAME, orderProgress, useStore } from '../store'
import { ago, fmtDate, mockPhoto } from '../mock'
import { STAGES, type Order } from '../types'
import { Btn, Modal, ProgressBar, ScrollArea, inputCls, readFile, useToast } from '../ui'
import { PhoneShell } from '../shared/PhoneShell'
import { stageIcons } from '../shared/Stepper'
import { stageState } from '../store'

const SENT = ['سنزور موقعك قريبًا لمعاينته', 'نراجع تفاصيل طلبك معك', 'نأخذ القياسات الدقيقة', 'طلبك قيد التصنيع في الورشة', 'قطع طلبك في الطريق', 'نفحص جودة طلبك بعناية', 'طلبك جاهز للتركيب عندك', 'طلبك جاهز للتسليم', 'تم تسليم طلبك — شكرًا لك']
const sentence = (o: Order) => o.rework ? 'نحسّن بعض التفاصيل لنضمن لك أفضل جودة' : o.stage === 7 && o.delivery.status === 'awaiting' ? 'طلبك جاهز — بانتظار تأكيد استلامك' : SENT[o.stage]

export function CustomerLayout() {
  const { activeProjectId } = useStore()
  const nav = [
    { to: '/customer', label: 'الرئيسية', icon: Home, end: true },
    { to: `/customer/project/${activeProjectId}`, label: 'مشروعي', icon: Hammer, end: true },
    { to: `/customer/project/${activeProjectId}/photos`, label: 'الصور', icon: ImageIcon },
    { to: `/customer/project/${activeProjectId}/message`, label: 'ملاحظة', icon: MessageSquare },
    { to: `/customer/project/${activeProjectId}/delivery`, label: 'التسليم', icon: PackageCheck },
  ]
  return (
    <PhoneShell caption="بوابة الزبائن — مصمّمة للهاتف">
      <header className="shrink-0 bg-white border-b border-line px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand text-white grid place-items-center"><Hammer size={20} /></div>
        <div className="leading-tight flex-1"><div className="font-extrabold">ورشة الفولاذ</div><div className="text-xs text-mute">بوابة الزبائن</div></div>
        <div className="text-sm font-bold text-mute">{CUSTOMER_NAME}</div>
      </header>
      <ScrollArea className="flex-1 min-h-0"><Outlet /></ScrollArea>
      <nav className="shrink-0 grid grid-cols-5 bg-white border-t border-line pb-[env(safe-area-inset-bottom)]">
        {nav.map(n => (
          <NavLink key={n.label} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[13px] font-bold ${isActive ? 'text-brand' : 'text-mute'}`}>
            {({ isActive }) => <><span className={`w-12 h-8 rounded-full grid place-items-center ${isActive ? 'bg-brand-soft' : ''}`}><n.icon size={22} /></span>{n.label}</>}
          </NavLink>
        ))}
      </nav>
    </PhoneShell>
  )
}

export function ProjectRoute() {
  const { id } = useParams(); const { db, setActiveProjectId } = useStore()
  useEffect(() => { if (id) setActiveProjectId(id) }, [id]) // eslint-disable-line
  if (!db.projects.find(p => p.id === id)) return <Navigate to="/customer" replace />
  return <Outlet />
}

const Title = ({ children, sub }: { children: React.ReactNode; sub?: string }) => <div className="px-4 pt-5 pb-2"><h1 className="text-3xl font-extrabold">{children}</h1>{sub && <p className="text-mute text-lg mt-1">{sub}</p>}</div>

/* ---------- الرئيسية ---------- */
export function CustomerHome() {
  const { db } = useStore()
  const projects = db.projects.filter(p => p.customer === CUSTOMER_NAME)
  const waiting = db.orders.filter(o => projects.some(p => p.id === o.projectId) && o.stage === 7 && o.delivery.status === 'awaiting')
  return (
    <div className="p-4 space-y-4 fade-up">
      <div className="bg-brand text-white rounded-3xl p-6">
        <div className="text-lg opacity-90">أهلاً بك</div><h1 className="text-3xl font-extrabold mt-0.5">يا {CUSTOMER_NAME.split(' ')[0]}</h1>
        <p className="mt-2 opacity-95 text-lg">نتابع لك طلباتك خطوة بخطوة، وكل جديد يظهر هنا.</p>
      </div>
      {waiting.map(o => (
        <Link key={o.id} to={`/customer/project/${o.projectId}/delivery`} className="flex items-center gap-3 bg-warn-soft border-2 border-warn/50 rounded-2xl p-4">
          <PackageCheck size={36} className="text-warn shrink-0" /><div className="flex-1"><div className="text-lg font-extrabold">طلبيتك جاهزة!</div><div className="text-base">{o.title} — اضغط لتأكيد الاستلام</div></div><ChevronLeft className="text-warn" />
        </Link>
      ))}
      <h2 className="text-xl font-extrabold pt-1">مشاريعك</h2>
      {projects.map(p => {
        const os = db.orders.filter(o => o.projectId === p.id)
        const prog = os.reduce((s, o) => s + orderProgress(o), 0) / Math.max(1, os.length)
        const lead = [...os].filter(o => o.stage < 8).sort((a, b) => a.stage - b.stage)[0] ?? os[0]
        return (
          <Link key={p.id} to={`/customer/project/${p.id}`} className="block bg-white border border-line rounded-3xl p-5 active:scale-[.99] transition">
            <div className="flex items-start justify-between gap-2"><div><h3 className="text-2xl font-extrabold">{p.name}</h3><div className="text-mute">{p.location} · {os.length} {os.length === 1 ? 'طلبية' : 'طلبيات'}</div></div><ChevronLeft className="text-mute mt-1" /></div>
            {lead && <div className="mt-3 bg-brand-soft/70 rounded-xl px-3 py-2.5 text-lg font-bold text-brand-dark">{sentence(lead)}</div>}
            <div className="mt-4"><div className="flex justify-between font-bold mb-1.5"><span>التقدّم</span><span>{Math.round(prog * 100)}%</span></div><ProgressBar value={prog} h="h-3.5" /></div>
          </Link>
        )
      })}
    </div>
  )
}

/* ---------- تفاصيل المشروع ---------- */
function useProject() {
  const { id } = useParams(); const { db } = useStore()
  const p = db.projects.find(x => x.id === id)!
  return { p, os: db.orders.filter(o => o.projectId === id) }
}
function OrderChips({ os, sel, onSel, all }: { os: Order[]; sel: string; onSel: (v: string) => void; all?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2">
      {all && <button onClick={() => onSel('')} className={`shrink-0 px-4 h-12 rounded-full font-bold text-base border-2 ${sel === '' ? 'bg-brand text-white border-brand' : 'bg-white border-line'}`}>{all}</button>}
      {os.map(o => <button key={o.id} onClick={() => onSel(o.id)} className={`shrink-0 px-4 h-12 rounded-full font-bold text-base border-2 ${sel === o.id ? 'bg-brand text-white border-brand' : 'bg-white border-line'}`}>{o.id}</button>)}
    </div>
  )
}

export function CustomerProject() {
  const { p, os } = useProject()
  const [sel, setSel] = useState(os[0]?.id ?? '')
  const o = os.find(x => x.id === sel) ?? os[0]
  if (!o) return <div className="p-6 text-center text-xl text-mute">لا توجد طلبيات في هذا المشروع بعد.</div>
  const prog = orderProgress(o)
  return (
    <div className="fade-up pb-6">
      <Title sub={`${p.location}`}>{p.name}</Title>
      <OrderChips os={os} sel={o.id} onSel={setSel} />
      <div className="px-4 space-y-4 mt-2">
        <div className="bg-white border border-line rounded-3xl p-5">
          <div className="text-mute font-bold">رقم الطلبية</div><div className="text-2xl font-extrabold">{o.id}</div>
          <div className="text-lg mt-1">{o.title}</div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-brand-soft rounded-2xl p-3"><div className="text-sm text-brand-dark font-bold">المرحلة الحالية</div><div className="text-xl font-extrabold mt-0.5">{o.stage >= 8 ? 'تم التسليم' : STAGES[o.stage].cust}</div></div>
            <div className="bg-card rounded-2xl p-3"><div className="text-sm text-mute font-bold flex items-center gap-1"><CalendarDays size={14} />التسليم المتوقع</div><div className="text-xl font-extrabold mt-0.5">{o.stage >= 8 ? 'تم' : fmtDate(o.estDelivery)}</div></div>
          </div>
          <div className="mt-4"><div className="flex justify-between font-bold mb-1.5"><span>{sentence(o)}</span><span>{Math.round(prog * 100)}%</span></div><ProgressBar value={prog} h="h-3.5" tone={o.rework ? 'warn' : 'ok'} /></div>
        </div>
        <div className="bg-white border border-line rounded-3xl p-5">
          <h2 className="text-xl font-extrabold mb-4">مراحل طلبيتك</h2>
          <div>
            {STAGES.map((s, i) => {
              const st = stageState(o, i); const Icon = stageIcons[i]; const last = i === STAGES.length - 1
              const done = st === 'done'; const cur = st === 'current' || st === 'rework'
              return (
                <div key={s.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full grid place-items-center shrink-0 border-2 ${done ? 'bg-brand text-white border-brand' : st === 'rework' ? 'bg-warn text-white border-warn ring' : cur ? 'bg-white text-brand border-brand border-[3px] ring' : 'bg-card text-mute border-line'}`}>{done ? <Check size={24} strokeWidth={3} /> : <Icon size={22} />}</div>
                    {!last && <div className={`w-1 flex-1 min-h-6 ${done ? 'bg-brand' : 'bg-line'}`} />}
                  </div>
                  <div className={`pb-5 pt-1.5 ${cur ? '' : ''}`}>
                    <div className={`text-xl ${cur ? 'font-extrabold text-brand-dark' : done ? 'font-bold' : 'text-mute font-bold'}`}>{s.cust}</div>
                    <div className="text-base text-mute">{done ? 'تمّت' : cur ? 'نعمل عليها الآن' : 'قادمة'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to={`/customer/project/${p.id}/photos`}><Btn variant="secondary" size="lg" className="w-full" icon={<Camera size={22} />}>شاهد الصور</Btn></Link>
          <Link to={`/customer/project/${p.id}/message`}><Btn variant="secondary" size="lg" className="w-full" icon={<MessageSquare size={22} />}>أرسل ملاحظة</Btn></Link>
        </div>
      </div>
    </div>
  )
}

/* ---------- صور المشروع ---------- */
export function CustomerPhotos() {
  const { p, os } = useProject(); const { db } = useStore()
  const [sel, setSel] = useState(''); const [view, setView] = useState<string | null>(null)
  const photos = db.photos.filter(x => x.visible && os.some(o => o.id === x.orderId) && (!sel || x.orderId === sel))
  const viewing = photos.find(x => x.id === view)
  const groups = STAGES.map((s, i) => ({ s, i, list: photos.filter(x => x.stage === s.key).sort((a, b) => b.at.localeCompare(a.at)) })).filter(g => g.list.length)
  return (
    <div className="fade-up pb-6">
      <Title sub={p.name}>صور المشروع</Title>
      <OrderChips os={os} sel={sel} onSel={setSel} all="كل الطلبيات" />
      <div className="px-4 space-y-5 mt-3">
        {groups.length === 0 && <div className="text-center py-14 text-mute"><ImageIcon size={56} className="mx-auto mb-3" /><div className="text-xl font-bold">لا توجد صور بعد</div><div>سنضيف صور التقدّم هنا أولًا بأول.</div></div>}
        {groups.map(({ s, i, list }) => (
          <div key={s.key}>
            <h2 className="text-xl font-extrabold mb-2 flex items-center gap-2">{(() => { const I = stageIcons[i]; return <I size={22} className="text-brand" /> })()}{s.cust}</h2>
            <div className="grid grid-cols-2 gap-3">
              {list.map(ph => (
                <button key={ph.id} onClick={() => setView(ph.id)} className="rounded-2xl overflow-hidden bg-white border border-line text-start active:scale-[.98]">
                  <img src={ph.src} alt={ph.note} className="w-full aspect-[4/3] object-cover" />
                  <div className="p-2.5 text-sm"><div className="font-bold">{ph.orderId}</div><div className="text-mute">{ago(ph.at)}</div></div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!viewing} onClose={() => setView(null)} title="الصورة">
        {viewing && <><img src={viewing.src} alt="" className="w-full rounded-2xl" />{viewing.note && <p className="text-lg">{viewing.note}</p>}<p className="text-sm text-mute">{viewing.orderId} · {STAGES.find(s => s.key === viewing.stage)?.cust} · {ago(viewing.at)}</p></>}
      </Modal>
    </div>
  )
}

/* ---------- إرسال ملاحظة ---------- */
export function CustomerMessage() {
  const { p, os } = useProject(); const { db, addMessage } = useStore(); const toast = useToast()
  const [text, setText] = useState(''); const [img, setImg] = useState(''); const [sel, setSel] = useState(''); const [sent, setSent] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const msgs = db.messages.filter(m => m.projectId === p.id)
  const send = () => { addMessage({ projectId: p.id, from: 'customer', text: (sel ? `[${sel}] ` : '') + text.trim(), image: img || undefined }); setSent(true); setText(''); setImg(''); toast('وصلت رسالتك') }
  return (
    <div className="fade-up pb-6">
      <Title sub={p.name}>أرسل ملاحظة</Title>
      <div className="px-4 space-y-4 mt-1">
        {sent ? (
          <div className="bg-brand-soft rounded-3xl p-7 text-center space-y-3">
            <CheckCircle2 size={72} className="mx-auto text-brand" /><div className="text-2xl font-extrabold">وصلت رسالتك!</div><p className="text-lg">سنرد عليك في أقرب وقت.</p>
            <Btn size="lg" className="w-full" onClick={() => setSent(false)}>إرسال ملاحظة أخرى</Btn>
          </div>
        ) : (
          <div className="bg-white border border-line rounded-3xl p-5 space-y-4">
            <div><div className="font-bold mb-2">بخصوص</div><div className="flex flex-wrap gap-2">
              {[['', 'المشروع كله'], ...os.map(o => [o.id, o.id])].map(([v, l]) => <button key={v} onClick={() => setSel(v)} className={`px-4 h-11 rounded-full font-bold border-2 ${sel === v ? 'bg-brand text-white border-brand' : 'bg-white border-line'}`}>{l}</button>)}</div></div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="اكتب ملاحظتك أو سؤالك هنا…" className={`${inputCls} !h-32 py-3 !text-lg`} />
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setImg(await readFile(f)); e.target.value = '' }} />
            {img ? <div className="relative"><img src={img} alt="" className="w-full rounded-2xl max-h-48 object-cover" /><button onClick={() => setImg('')} className="absolute top-2 start-2 w-10 h-10 rounded-full bg-ink/70 text-white grid place-items-center"><X size={20} /></button></div> : (
              <div className="grid grid-cols-2 gap-2">
                <Btn variant="secondary" size="lg" icon={<ImagePlus size={22} />} onClick={() => ref.current?.click()}>إرفاق صورة</Btn>
                <Btn variant="ghost" size="lg" className="border border-dashed border-line" onClick={() => setImg(mockPhoto('gate', 1))}>صورة تجريبية</Btn>
              </div>)}
            <Btn size="lg" className="w-full" disabled={!text.trim()} icon={<Send size={22} />} onClick={send}>إرسال الملاحظة</Btn>
          </div>
        )}
        {msgs.length > 0 && <div><h2 className="text-xl font-extrabold mb-2">محادثتك مع الورشة</h2>
          <div className="space-y-2.5">{msgs.map(m => (
            <div key={m.id} className={`max-w-[88%] rounded-2xl p-3.5 ${m.from === 'customer' ? 'bg-brand text-white' : 'bg-white border border-line ms-auto'}`}>
              {m.image && <img src={m.image} alt="" className="rounded-xl mb-2 max-h-40" />}
              <div className="text-lg">{m.text}</div><div className={`text-xs mt-1 ${m.from === 'customer' ? 'text-white/80' : 'text-mute'}`}>{m.from === 'customer' ? 'أنت' : 'الورشة'} · {ago(m.at)}</div>
            </div>))}</div></div>}
      </div>
    </div>
  )
}

/* ---------- التسليم ---------- */
export function CustomerDelivery() {
  const { p, os } = useProject(); const { customerAccept, customerReport } = useStore(); const toast = useToast(); const nav = useNavigate()
  const [acc, setAcc] = useState<Order | null>(null); const [rep, setRep] = useState<Order | null>(null); const [txt, setTxt] = useState('')
  const [rate, setRate] = useState<Record<string, number>>({})
  const quick = ['خدش في الدهان', 'القياس غير مناسب', 'مشكلة في القفل', 'تحتاج تعديل']
  return (
    <div className="fade-up pb-6">
      <Title sub={p.name}>التسليم</Title>
      <div className="px-4 space-y-4 mt-1">
        {os.map(o => (
          <div key={o.id} className={`rounded-3xl p-5 border-2 ${o.stage === 7 && o.delivery.status === 'awaiting' ? 'bg-warn-soft/60 border-warn/50' : 'bg-white border-line'}`}>
            <div className="text-mute font-bold">{o.id}</div><h3 className="text-2xl font-extrabold">{o.title}</h3>
            {o.stage < 7 && <div className="mt-3 flex items-center gap-3 text-lg"><Truck className="text-mute" /><span>لم يحن موعد التسليم بعد — المتوقع <b>{fmtDate(o.estDelivery)}</b></span></div>}
            {o.stage === 7 && o.delivery.status === 'pending' && <div className="mt-3 text-lg bg-brand-soft rounded-xl p-3 font-bold text-brand-dark">اكتمل التركيب — سنرسل لك طلب الاستلام قريبًا.</div>}
            {o.stage === 7 && o.delivery.status === 'awaiting' && <>
              <div className="mt-3 space-y-2 text-lg">
                <div className="flex items-center gap-2"><CheckCircle2 className="text-brand" size={22} />تم تصنيع الطلبية وتركيبها</div>
                <div className="flex items-center gap-2"><CalendarDays className="text-brand" size={22} />موعد التسليم: {fmtDate(o.estDelivery)}</div>
                <div className="flex items-center gap-2"><PackageCheck className="text-brand" size={22} />فريق التركيب بانتظار تأكيدك</div>
              </div>
              <div className="mt-4 space-y-3">
                <Btn size="xl" className="w-full !h-20" icon={<Check size={32} />} onClick={() => setAcc(o)}>قبول التسليم</Btn>
                <Btn size="lg" variant="secondary" className="w-full !text-warn border-warn" icon={<AlertTriangle size={22} />} onClick={() => { setRep(o); setTxt('') }}>الإبلاغ عن مشكلة</Btn>
              </div></>}
            {o.stage >= 8 && <div className="mt-3 space-y-3"><div className="flex items-center gap-2 text-xl font-extrabold text-brand-dark"><CheckCircle2 size={28} />تم الاستلام — شكرًا لثقتك بنا</div>
              <div><div className="font-bold mb-1">كيف كانت تجربتك؟</div><div className="flex gap-1.5">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => { setRate({ ...rate, [o.id]: n }); toast('شكرًا لتقييمك') }}><Star size={38} className={n <= (rate[o.id] ?? 0) ? 'fill-warn text-warn' : 'text-line'} /></button>)}</div></div></div>}
            {o.stage === 7 && o.delivery.status === 'issue' && <div className="mt-3 text-lg bg-bad-soft rounded-xl p-3 font-bold text-bad">وصلنا بلاغك وسنتواصل معك لإصلاح المشكلة.</div>}
            {o.stage < 7 && o.delivery.status === 'issue' && <div className="mt-3 text-lg bg-warn-soft rounded-xl p-3 font-bold">نعمل على إصلاح ملاحظتك الآن.</div>}
          </div>
        ))}
      </div>
      <Modal open={!!acc} onClose={() => setAcc(null)} title="تأكيد الاستلام"
        footer={<><Btn variant="secondary" size="lg" onClick={() => setAcc(null)}>رجوع</Btn><Btn size="lg" icon={<Check size={20} />} onClick={() => { customerAccept(acc!.id); setAcc(null); toast('تم قبول التسليم — شكرًا لك!') }}>نعم، استلمت</Btn></>}>
        <p className="text-xl">هل استلمت <b>{acc?.title}</b> وأنت راضٍ عنها؟</p>
      </Modal>
      <Modal open={!!rep} onClose={() => setRep(null)} title="ما هي المشكلة؟"
        footer={<><Btn variant="secondary" size="lg" onClick={() => setRep(null)}>إلغاء</Btn><Btn variant="warn" size="lg" disabled={!txt.trim()} onClick={() => { customerReport(rep!.id, txt.trim()); setRep(null); toast('تم إرسال بلاغك للورشة', 'warn'); nav(`/customer/project/${p.id}/delivery`) }}>إرسال البلاغ</Btn></>}>
        <div className="flex flex-wrap gap-2">{quick.map(q => <button key={q} onClick={() => setTxt(q)} className={`px-4 h-11 rounded-full font-bold border-2 ${txt === q ? 'bg-warn text-white border-warn' : 'bg-white border-line'}`}>{q}</button>)}</div>
        <textarea value={txt} onChange={e => setTxt(e.target.value)} placeholder="اشرح المشكلة بإيجاز…" className={`${inputCls} !h-28 py-3 !text-lg`} />
      </Modal>
    </div>
  )
}
