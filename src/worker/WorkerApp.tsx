import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Calendar, Camera, CheckCircle2, ChevronLeft, ClipboardCheck, Flame, Hammer, HelpCircle, MapPin, Package, PaintBucket, Pencil, Play, Ruler, ShieldAlert, Sparkles, Wrench, Check, ImagePlus, Folder } from 'lucide-react'
import { WORKER_ID, useStore } from '../store'
import { mockPhoto, fmtDate } from '../mock'
import { Btn, ScrollArea, readFile, useToast } from '../ui'
import { PhoneShell } from '../shared/PhoneShell'
import type { Task } from '../types'

function taskIcon(title: string) {
  if (title.includes('لحام')) return Flame
  if (title.includes('دهان')) return PaintBucket
  if (title.includes('قص')) return Hammer
  return Wrench
}

export function WorkerLayout() {
  return <PhoneShell caption="تطبيق العمال — مصمّم للهاتف"><ScrollArea className="flex-1 min-h-0"><Outlet /></ScrollArea></PhoneShell>
}

function useTask() {
  const { id } = useParams(); const { db } = useStore()
  const t = db.tasks.find(x => x.id === id)
  const o = db.orders.find(x => x.id === t?.orderId)
  const p = db.projects.find(x => x.id === o?.projectId)
  const me = db.employees.find(e => e.id === WORKER_ID)!
  return { t, o, p, me }
}

const BackBar = ({ to, title }: { to: string; title: string }) => (
  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
    <Link to={to} aria-label="رجوع" className="w-16 h-16 rounded-full bg-card grid place-items-center shrink-0 active:scale-95"><ArrowRight size={34} /></Link>
    <h1 className="text-2xl font-extrabold leading-tight">{title}</h1>
  </div>
)

const statusUi = {
  todo: { label: 'جديدة', cls: 'bg-warn-soft text-[#a85f14]', icon: Sparkles },
  doing: { label: 'قيد العمل', cls: 'bg-brand-soft text-brand-dark', icon: Play },
  done: { label: 'تمت', cls: 'bg-card text-mute', icon: Check },
}

/* ---------- مهامي ---------- */
export function MyTasks() {
  const { db } = useStore()
  const me = db.employees.find(e => e.id === WORKER_ID)!
  const mine = db.tasks.filter(t => t.workerId === WORKER_ID)
  const active = mine.filter(t => t.status !== 'done'); const done = mine.filter(t => t.status === 'done')
  return (
    <div className="p-4 space-y-5 fade-up">
      <div className="pt-2"><div className="text-lg text-mute font-bold">أهلاً بك</div><h1 className="text-4xl font-extrabold">يا {me.name.split(' ')[0]}</h1>
        <p className="text-xl mt-2 font-bold text-brand-dark">{active.length === 0 ? 'لا توجد مهام جديدة' : `عندك ${active.length} ${active.length === 1 ? 'مهمة' : 'مهام'} اليوم`}</p></div>
      <h2 className="text-2xl font-extrabold flex items-center gap-2"><ClipboardCheck size={28} className="text-brand" />مهامي</h2>
      <div className="space-y-4">
        {active.length === 0 && <div className="bg-brand-soft rounded-3xl p-8 text-center"><CheckCircle2 size={64} className="mx-auto text-brand" /><div className="text-2xl font-extrabold mt-3">أنهيت كل مهامك!</div></div>}
        {active.map(t => <TaskCard key={t.id} t={t} />)}
      </div>
      {done.length > 0 && <>
        <h2 className="text-xl font-extrabold text-mute pt-2">مهام منتهية</h2>
        <div className="space-y-3 opacity-80">{done.map(t => <TaskCard key={t.id} t={t} />)}</div></>}
    </div>
  )
}
function TaskCard({ t }: { t: Task }) {
  const { db } = useStore(); const Icon = taskIcon(t.title); const s = statusUi[t.status]; const SI = s.icon
  const p = db.projects.find(x => x.id === db.orders.find(o => o.id === t.orderId)?.projectId)
  return (
    <Link to={`/worker/task/${t.id}`} className={`block rounded-3xl bg-white border-2 p-4 active:scale-[.98] transition ${t.urgent && t.status !== 'done' ? 'border-bad' : 'border-line'}`}>
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 rounded-2xl grid place-items-center shrink-0 ${t.status === 'done' ? 'bg-card text-mute' : 'bg-brand text-white'}`}><Icon size={40} /></div>
        <div className="flex-1 min-w-0"><div className="text-2xl font-extrabold leading-snug">{t.title}</div><div className="text-lg text-mute mt-0.5">{p?.name}</div></div>
        <ChevronLeft size={30} className="text-mute shrink-0" />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-lg font-extrabold ${s.cls}`}><SI size={18} />{s.label}</span>
        {t.urgent && t.status !== 'done' && <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-lg font-extrabold bg-bad-soft text-bad"><AlertTriangle size={18} />عاجلة</span>}
      </div>
    </Link>
  )
}

/* ---------- تفاصيل المهمة ---------- */
export function TaskDetail() {
  const { t, o, p } = useTask(); const { setTaskStatus } = useStore(); const nav = useNavigate()
  if (!t || !o) return <Navigate to="/worker" replace />
  const Icon = taskIcon(t.title)
  const rows: [ReactNode, string, string][] = [
    [<Folder size={28} />, 'المشروع', p?.name ?? ''], [<MapPin size={28} />, 'المكان', p?.location ?? ''], [<Calendar size={28} />, 'الموعد', fmtDate(t.due)],
  ]
  return (
    <div className="fade-up pb-6">
      <BackBar to="/worker" title="تفاصيل المهمة" />
      <div className="p-4 space-y-5">
        <div className="bg-white border-2 border-line rounded-3xl p-5 text-center">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-brand text-white grid place-items-center"><Icon size={64} /></div>
          <h2 className="text-3xl font-extrabold mt-4 leading-snug">{t.title}</h2>
        </div>
        <div className="space-y-3">{rows.map(([ic, l, v]) => <div key={l} className="flex items-center gap-4 bg-card rounded-2xl p-4"><span className="text-brand">{ic}</span><div><div className="text-base text-mute font-bold">{l}</div><div className="text-2xl font-extrabold">{v}</div></div></div>)}</div>
        {t.hint && <div className="bg-warn-soft rounded-2xl p-4 flex gap-3"><AlertTriangle className="text-warn shrink-0" size={32} /><div><div className="text-lg font-extrabold text-[#a85f14]">انتبه</div><div className="text-xl">{t.hint}</div></div></div>}
        {t.status === 'todo' && <Btn size="xl" className="w-full" icon={<Play size={32} />} onClick={() => { setTaskStatus(t.id, 'doing'); nav(`/worker/task/${t.id}/work`) }}>ابدأ العمل</Btn>}
        {t.status === 'doing' && <Btn size="xl" className="w-full" icon={<Play size={32} />} onClick={() => nav(`/worker/task/${t.id}/work`)}>تابع العمل</Btn>}
        {t.status === 'done' && <div className="bg-brand-soft rounded-2xl p-5 text-center"><CheckCircle2 size={52} className="mx-auto text-brand" /><div className="text-2xl font-extrabold mt-2">أنهيت هذه المهمة</div></div>}
      </div>
    </div>
  )
}

function useNow() { const [n, setN] = useState(Date.now()); useEffect(() => { const i = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(i) }, []); return n }
const pad = (n: number) => String(n).padStart(2, '0')

function useCounts(t: Task | undefined, name: string) {
  const { db } = useStore()
  if (!t) return { photos: 0, notes: 0 }
  return {
    photos: db.photos.filter(p => p.orderId === t.orderId && p.stage === t.stage && p.by === name && (!t.startedAt || p.at >= t.startedAt)).length,
    notes: db.notes.filter(n => n.orderId === t.orderId && n.stage === t.stage && n.by === name && (!t.startedAt || n.at >= t.startedAt)).length,
  }
}

/* ---------- بدء العمل (أثناء العمل) ---------- */
export function TaskWork() {
  const { t, me } = useTask(); const now = useNow(); const c = useCounts(t, me.name)
  if (!t) return <Navigate to="/worker" replace />
  if (t.status === 'todo') return <Navigate to={`/worker/task/${t.id}`} replace />
  const secs = Math.max(0, Math.floor((now - new Date(t.startedAt ?? now).getTime()) / 1000))
  const tiles = [
    { to: 'photo', icon: Camera, label: 'صوّر', color: 'bg-info text-white', n: c.photos },
    { to: 'note', icon: Pencil, label: 'ملاحظة', color: 'bg-warn text-white', n: c.notes },
    { to: 'problem', icon: AlertTriangle, label: 'مشكلة', color: 'bg-bad text-white', n: 0 },
  ]
  return (
    <div className="fade-up pb-6">
      <BackBar to={`/worker/task/${t.id}`} title="جاري العمل" />
      <div className="p-4 space-y-5">
        <div className="bg-brand text-white rounded-3xl p-6 text-center">
          <div className="text-xl font-bold opacity-90">{t.title}</div>
          <div className="text-7xl font-extrabold tabular-nums mt-2" dir="ltr">{pad(Math.floor(secs / 60))}:{pad(secs % 60)}</div>
          <div className="text-lg opacity-90 mt-1">وقت العمل</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {tiles.map(x => (
            <Link key={x.to} to={`/worker/task/${t.id}/${x.to}`} className={`relative rounded-3xl h-36 flex flex-col items-center justify-center gap-2 active:scale-95 ${x.color}`}>
              <x.icon size={48} /><span className="text-2xl font-extrabold">{x.label}</span>
              {x.n > 0 && <span className="absolute top-2 start-2 bg-white text-ink w-8 h-8 rounded-full grid place-items-center font-extrabold">{x.n}</span>}
            </Link>
          ))}
        </div>
        <Link to={`/worker/task/${t.id}/finish`}><Btn size="xl" className="w-full h-24 text-3xl" icon={<CheckCircle2 size={40} />}>أنهيت العمل</Btn></Link>
      </div>
    </div>
  )
}

function Saved({ title, sub, to, label }: { title: string; sub: string; to: string; label: string }) {
  return (
    <div className="p-6 pt-16 text-center space-y-5 fade-up">
      <div className="w-36 h-36 mx-auto rounded-full bg-brand-soft grid place-items-center"><CheckCircle2 size={96} className="text-brand" /></div>
      <h1 className="text-4xl font-extrabold">{title}</h1><p className="text-xl text-mute">{sub}</p>
      <Link to={to} className="block pt-4"><Btn size="xl" className="w-full">{label}</Btn></Link>
    </div>
  )
}

/* ---------- تصوير العمل ---------- */
export function TaskPhoto() {
  const { t, me } = useTask(); const { addPhoto } = useStore(); const toast = useToast()
  const ref = useRef<HTMLInputElement>(null)
  const [src, setSrc] = useState(''); const [note, setNote] = useState(''); const [saved, setSaved] = useState(false)
  if (!t) return <Navigate to="/worker" replace />
  const back = `/worker/task/${t.id}/work`
  if (saved) return <Saved title="تم حفظ الصورة" sub="وصلت الصورة إلى الورشة" to={back} label="رجوع للعمل" />
  return (
    <div className="fade-up pb-6">
      <BackBar to={back} title="صوّر عملك" />
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setSrc(await readFile(f)); e.target.value = '' }} />
      <div className="p-4 space-y-5">
        {!src ? <>
          <button onClick={() => ref.current?.click()} className="w-full h-64 rounded-3xl bg-info text-white flex flex-col items-center justify-center gap-4 active:scale-[.98]"><Camera size={96} /><span className="text-3xl font-extrabold">التقط صورة</span></button>
          <button onClick={() => setSrc(mockPhoto(t.title.includes('دهان') ? 'paint' : t.title.includes('لحام') ? 'weld' : 'gate', Math.floor(Math.random() * 4)))} className="w-full h-20 rounded-2xl border-2 border-dashed border-line text-xl font-bold text-mute flex items-center justify-center gap-3"><ImagePlus size={30} />صورة تجريبية (للعرض)</button>
        </> : <>
          <img src={src} alt="الصورة" className="w-full rounded-3xl border-2 border-line" />
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="اكتب جملة قصيرة (اختياري)" className="w-full h-16 px-4 rounded-2xl border-2 border-line text-xl outline-none focus:border-brand bg-white" />
          <Btn size="xl" className="w-full" icon={<Check size={36} />} onClick={() => { addPhoto({ orderId: t.orderId, stage: t.stage, src, note, visible: false, by: me.name }); setSaved(true); toast('تم حفظ الصورة') }}>احفظ الصورة</Btn>
          <Btn size="lg" variant="secondary" className="w-full" onClick={() => setSrc('')}>صورة أخرى</Btn>
        </>}
      </div>
    </div>
  )
}

/* ---------- إضافة ملاحظة ---------- */
const QUICK = ['الشغل ماشي تمام', 'خلصت جزء من الشغل', 'محتاج مواد إضافية', 'الحديد جاهز']
export function TaskNote() {
  const { t, me } = useTask(); const { addNote } = useStore()
  const [text, setText] = useState(''); const [saved, setSaved] = useState(false)
  if (!t) return <Navigate to="/worker" replace />
  const back = `/worker/task/${t.id}/work`
  if (saved) return <Saved title="تم حفظ الملاحظة" sub="الورشة ستقرأها" to={back} label="رجوع للعمل" />
  return (
    <div className="fade-up pb-6">
      <BackBar to={back} title="أضف ملاحظة" />
      <div className="p-4 space-y-5">
        <div className="text-xl font-bold text-mute">اضغط على جملة جاهزة أو اكتب:</div>
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map(q => <button key={q} onClick={() => setText(x => x ? x + ' - ' + q : q)} className="min-h-20 rounded-2xl bg-warn-soft text-[#8a4f10] text-xl font-extrabold p-3 active:scale-95">{q}</button>)}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="ملاحظتك هنا…" className="w-full h-40 p-4 rounded-2xl border-2 border-line text-2xl outline-none focus:border-brand bg-white" />
        <Btn size="xl" className="w-full" disabled={!text.trim()} icon={<Check size={36} />} onClick={() => { addNote({ orderId: t.orderId, stage: t.stage, text: text.trim(), by: me.name }); setSaved(true) }}>احفظ الملاحظة</Btn>
      </div>
    </div>
  )
}

/* ---------- الإبلاغ عن مشكلة ---------- */
const PROBLEMS = [
  { k: 'مواد ناقصة', icon: Package }, { k: 'عطل في المعدات', icon: Wrench }, { k: 'خطأ في القياسات', icon: Ruler },
  { k: 'خطر أو حادث', icon: ShieldAlert }, { k: 'مشكلة أخرى', icon: HelpCircle }, { k: 'أحتاج مساعدة', icon: AlertTriangle },
]
export function TaskProblem() {
  const { t, me } = useTask(); const { reportProblem } = useStore()
  const [kind, setKind] = useState(''); const [text, setText] = useState(''); const [saved, setSaved] = useState(false)
  if (!t) return <Navigate to="/worker" replace />
  const back = `/worker/task/${t.id}/work`
  if (saved) return <Saved title="تم إبلاغ الورشة" sub="المدير سيتواصل معك بأقرب وقت" to={back} label="رجوع للعمل" />
  return (
    <div className="fade-up pb-6">
      <BackBar to={back} title="ما هي المشكلة؟" />
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {PROBLEMS.map(p => (
            <button key={p.k} onClick={() => setKind(p.k)} className={`h-36 rounded-3xl border-4 flex flex-col items-center justify-center gap-2 active:scale-95 ${kind === p.k ? 'border-bad bg-bad-soft text-bad' : 'border-line bg-white'}`}>
              <p.icon size={48} /><span className="text-xl font-extrabold px-1 leading-tight">{p.k}</span>
            </button>
          ))}
        </div>
        {kind && <input value={text} onChange={e => setText(e.target.value)} placeholder="اكتب تفاصيل قصيرة (اختياري)" className="w-full h-16 px-4 rounded-2xl border-2 border-line text-xl outline-none focus:border-bad bg-white" />}
        <Btn size="xl" variant="danger" className="w-full" disabled={!kind} icon={<AlertTriangle size={34} />} onClick={() => { reportProblem({ orderId: t.orderId, taskId: t.id, kind, text, by: me.name }); setSaved(true) }}>أرسل البلاغ</Btn>
      </div>
    </div>
  )
}

/* ---------- إنهاء المهمة ---------- */
export function TaskFinish() {
  const { t, me } = useTask(); const { setTaskStatus } = useStore(); const nav = useNavigate(); const c = useCounts(t, me.name)
  const [done, setDone] = useState(false)
  if (!t) return <Navigate to="/worker" replace />
  if (done) return (
    <div className="p-6 pt-14 text-center space-y-5 fade-up">
      <div className="w-44 h-44 mx-auto rounded-full bg-brand grid place-items-center ring"><CheckCircle2 size={110} className="text-white" /></div>
      <h1 className="text-4xl font-extrabold">أحسنت يا {me.name.split(' ')[0]}!</h1>
      <p className="text-2xl text-mute">تم إبلاغ الورشة بانتهاء العمل</p>
      <Link to="/worker" className="block pt-4"><Btn size="xl" className="w-full">العودة إلى مهامي</Btn></Link>
    </div>
  )
  return (
    <div className="fade-up pb-6">
      <BackBar to={`/worker/task/${t.id}/work`} title="إنهاء المهمة" />
      <div className="p-4 space-y-5">
        <div className="bg-white border-2 border-line rounded-3xl p-6 text-center"><h2 className="text-3xl font-extrabold leading-snug">هل أنهيت العمل؟</h2><p className="text-xl text-mute mt-2">{t.title}</p></div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-card rounded-2xl p-4"><Camera size={32} className="mx-auto text-info" /><div className="text-3xl font-extrabold">{c.photos}</div><div className="text-lg text-mute font-bold">صور</div></div>
          <div className="bg-card rounded-2xl p-4"><Pencil size={32} className="mx-auto text-warn" /><div className="text-3xl font-extrabold">{c.notes}</div><div className="text-lg text-mute font-bold">ملاحظات</div></div>
        </div>
        <Btn size="xl" className="w-full" icon={<Check size={40} />} onClick={() => { setTaskStatus(t.id, 'done'); setDone(true) }}>نعم، أنهيت العمل</Btn>
        <Btn size="lg" variant="secondary" className="w-full" onClick={() => nav(`/worker/task/${t.id}/work`)}>لا، رجوع</Btn>
      </div>
    </div>
  )
}
