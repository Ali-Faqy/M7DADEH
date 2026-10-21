import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { KINDS, STAGES, ROLE_LABELS, type Activity, type DB, type EmpRole, type Kind, type Message, type Note, type Order, type Photo, type Problem, type ReturnReq, type StageKey, type Task } from './types'
import { daysFrom, seed, uid } from './mock'

export const CUSTOMER_NAME = 'أحمد محمد'
export const WORKER_ID = 'e1'

interface Store {
  db: DB
  activeProjectId: string
  setActiveProjectId: (id: string) => void
  resetDemo: () => void
  addProject: (p: { name: string; customer: string; phone: string; location: string; estDelivery: string }) => string
  addOrder: (projectId: string, o: { title: string; kind: Kind; description: string; price: number }) => string
  updateOrder: (id: string, patch: Partial<Order>) => void
  advanceOrder: (id: string) => void
  approveQuality: (id: string) => void
  rejectQuality: (id: string, reason: string) => void
  customerAccept: (id: string) => void
  customerReport: (id: string, text: string) => void
  setTaskStatus: (id: string, status: Task['status']) => void
  assignTask: (id: string, workerId: string | null) => void
  addTask: (orderId: string, title: string) => void
  addPhoto: (p: Omit<Photo, 'id' | 'at'>) => void
  togglePhoto: (id: string) => void
  addNote: (n: Omit<Note, 'id' | 'at'>) => void
  reportProblem: (p: Omit<Problem, 'id' | 'at' | 'resolved'>) => void
  resolveProblem: (id: string) => void
  addReturn: (r: { orderId: string; reason: string; type: 'return' | 'rework'; source: ReturnReq['source']; sendBackTo: 'none' | 'manufacturing' | 'installation' }) => void
  setReturnStatus: (id: string, status: ReturnReq['status']) => void
  addMessage: (m: Omit<Message, 'id' | 'at'>) => void
  addEmployee: (e: { name: string; phone: string; role: EmpRole }) => void
  toggleEmployee: (id: string) => void
}

const Ctx = createContext<Store>(null!)
export const useStore = () => useContext(Ctx)

const log = (d: DB, text: string, orderId?: string, tone: Activity['tone'] = 'info'): DB => ({
  ...d, activity: [{ id: uid('a'), text, at: new Date().toISOString(), orderId, tone }, ...d.activity].slice(0, 40),
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seed)
  const [activeProjectId, setActiveProjectId] = useState('p1')

  const advance = useCallback((d: DB, id: string): DB => {
    const o = d.orders.find(x => x.id === id)
    if (!o || o.stage >= 8) return d
    const next = o.stage + 1
    const patch: Partial<Order> = { stage: next, rework: null }
    let tasks = d.tasks
    if (next === 3 && !d.tasks.some(t => t.orderId === id && t.stage === 'manufacturing')) {
      const noun = KINDS[o.kind].noun
      tasks = [...tasks,
        { id: uid('t'), orderId: id, title: `قص وتجهيز حديد ${noun}`, workerId: null, status: 'todo', stage: 'manufacturing', due: daysFrom(2) },
        { id: uid('t'), orderId: id, title: `لحام ${noun}`, workerId: null, status: 'todo', stage: 'manufacturing', due: daysFrom(4) },
        { id: uid('t'), orderId: id, title: `دهان وتشطيب ${noun}`, workerId: null, status: 'todo', stage: 'manufacturing', due: daysFrom(6) }]
    }
    if (next === 5) patch.quality = { checks: [false, false, false, false], status: 'pending', note: '' }
    if (next === 6 && !o.install.date) patch.install = { date: daysFrom(3), teamId: 'e7' }
    if (next === 7) patch.delivery = { status: 'pending' }
    let nd: DB = { ...d, tasks, orders: d.orders.map(x => x.id === id ? { ...x, ...patch } : x) }
    nd = log(nd, next >= 8 ? `${id}: تم التسليم النهائي وإغلاق الطلبية` : `${id}: انتقلت إلى مرحلة ${STAGES[next].label}`, id, 'ok')
    return nd
  }, [])

  const store: Store = useMemo(() => ({
    db, activeProjectId, setActiveProjectId,
    resetDemo: () => setDb(seed()),
    addProject: p => {
      const id = uid('p')
      setDb(d => log({ ...d, projects: [{ id, ...p, createdAt: new Date().toISOString() }, ...d.projects] }, `تم إنشاء ${p.name}`, undefined, 'info'))
      return id
    },
    addOrder: (projectId, o) => {
      const n = Math.max(0, ...db.orders.map(x => parseInt(x.id.slice(4)) || 0)) + 1
      const newId = `ORD-${String(n).padStart(3, '0')}`
      setDb(d => {
        const ord: Order = {
          id: newId, projectId, title: o.title, kind: o.kind, description: o.description, price: o.price, deposit: Math.round(o.price / 2),
          stage: 0, estDelivery: daysFrom(21), surveyDate: daysFrom(2), surveyorId: 'e6', measures: [],
          transport: { status: 'planned', dest: 'workshop', factory: '', driverId: null, vehicle: 'شاحنة صغيرة — 4 طن' },
          quality: { checks: [false, false, false, false], status: 'pending', note: '' },
          install: { date: '', teamId: null }, delivery: { status: 'pending' }, rework: null, createdAt: new Date().toISOString(),
        }
        return log({ ...d, orders: [...d.orders, ord] }, `${newId}: تمت إضافة طلبية جديدة (${o.title})`, newId, 'info')
      })
      return newId
    },
    updateOrder: (id, patch) => setDb(d => ({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, ...patch } : o) })),
    advanceOrder: id => setDb(d => advance(d, id)),
    approveQuality: id => setDb(d => {
      const o = d.orders.find(x => x.id === id); if (!o) return d
      const d2 = { ...d, orders: d.orders.map(x => x.id === id ? { ...x, quality: { ...x.quality, status: 'approved' as const } } : x) }
      return advance(log(d2, `${id}: اعتُمدت الجودة بنجاح`, id, 'ok'), id)
    }),
    rejectQuality: (id, reason) => setDb(d => {
      const o = d.orders.find(x => x.id === id); if (!o) return d
      const task: Task = { id: uid('t'), orderId: id, title: `إعادة عمل: ${reason}`.slice(0, 60), workerId: 'e1', status: 'todo', stage: 'manufacturing', due: daysFrom(1), urgent: true, hint: reason }
      const ret: ReturnReq = { id: uid('r'), orderId: id, reason, type: 'rework', status: 'open', createdAt: new Date().toISOString(), source: 'quality' }
      const d2: DB = {
        ...d, tasks: [...d.tasks, task], returns: [ret, ...d.returns],
        orders: d.orders.map(x => x.id === id ? { ...x, stage: 3, quality: { ...x.quality, status: 'rejected' as const, note: reason }, rework: { reason, fromStage: 5, at: new Date().toISOString() } } : x),
      }
      return log(d2, `${id}: رفضت الجودة الطلبية وأعيدت للتصنيع (${reason})`, id, 'bad')
    }),
    customerAccept: id => setDb(d => log({ ...d, orders: d.orders.map(o => o.id === id ? { ...o, stage: 8, delivery: { status: 'accepted' as const } } : o) }, `${id}: قبل الزبون التسليم — اكتملت الطلبية`, id, 'ok')),
    customerReport: (id, text) => setDb(d => {
      const ret: ReturnReq = { id: uid('r'), orderId: id, reason: text, type: 'return', status: 'open', createdAt: new Date().toISOString(), source: 'customer' }
      return log({ ...d, returns: [ret, ...d.returns], orders: d.orders.map(o => o.id === id ? { ...o, delivery: { status: 'issue' as const } } : o) }, `${id}: أبلغ الزبون عن مشكلة في التسليم`, id, 'bad')
    }),
    setTaskStatus: (id, status) => setDb(d => {
      const t = d.tasks.find(x => x.id === id); if (!t) return d
      const now = new Date().toISOString()
      const d2 = { ...d, tasks: d.tasks.map(x => x.id === id ? { ...x, status, startedAt: status === 'doing' ? now : x.startedAt, doneAt: status === 'done' ? now : undefined } : x) }
      const who = d.employees.find(e => e.id === t.workerId)?.name ?? 'الفريق'
      if (status === 'doing') return log(d2, `${t.orderId}: بدأ ${who} مهمة «${t.title}»`, t.orderId, 'info')
      if (status === 'done') return log(d2, `${t.orderId}: أنهى ${who} مهمة «${t.title}»`, t.orderId, 'ok')
      return d2
    }),
    assignTask: (id, workerId) => setDb(d => {
      const t = d.tasks.find(x => x.id === id)
      const w = d.employees.find(e => e.id === workerId)
      const d2 = { ...d, tasks: d.tasks.map(x => x.id === id ? { ...x, workerId } : x) }
      return t && w ? log(d2, `${t.orderId}: تم تكليف ${w.name} بمهمة «${t.title}»`, t.orderId, 'info') : d2
    }),
    addTask: (orderId, title) => setDb(d => ({ ...d, tasks: [...d.tasks, { id: uid('t'), orderId, title, workerId: null, status: 'todo', stage: 'manufacturing', due: daysFrom(3) }] })),
    addPhoto: p => setDb(d => log({ ...d, photos: [{ ...p, id: uid('ph'), at: new Date().toISOString() }, ...d.photos] }, `${p.orderId}: أضاف ${p.by} صورة جديدة`, p.orderId, 'info')),
    togglePhoto: id => setDb(d => ({ ...d, photos: d.photos.map(p => p.id === id ? { ...p, visible: !p.visible } : p) })),
    addNote: n => setDb(d => ({ ...d, notes: [{ ...n, id: uid('n'), at: new Date().toISOString() }, ...d.notes] })),
    reportProblem: p => setDb(d => log({ ...d, problems: [{ ...p, id: uid('pr'), at: new Date().toISOString(), resolved: false }, ...d.problems] }, `${p.orderId}: ${p.by} أبلغ عن مشكلة (${p.kind})`, p.orderId, 'warn')),
    resolveProblem: id => setDb(d => ({ ...d, problems: d.problems.map(p => p.id === id ? { ...p, resolved: true } : p) })),
    addReturn: r => setDb(d => {
      const ret: ReturnReq = { id: uid('r'), orderId: r.orderId, reason: r.reason, type: r.type, status: 'open', createdAt: new Date().toISOString(), source: r.source }
      let tasks = d.tasks
      let orders = d.orders
      if (r.sendBackTo !== 'none') {
        const idx = r.sendBackTo === 'manufacturing' ? 3 : 6
        orders = orders.map(o => o.id === r.orderId ? { ...o, stage: idx, delivery: { status: 'pending' as const }, rework: { reason: r.reason, fromStage: 7, at: new Date().toISOString() } } : o)
        if (idx === 3) tasks = [...tasks, { id: uid('t'), orderId: r.orderId, title: `إعادة عمل: ${r.reason}`.slice(0, 60), workerId: 'e1', status: 'todo', stage: 'manufacturing', due: daysFrom(1), urgent: true, hint: r.reason }]
      }
      return log({ ...d, returns: [ret, ...d.returns], tasks, orders }, `${r.orderId}: ${r.type === 'return' ? 'طلب مرتجع' : 'طلب إعادة عمل'} (${r.reason})`, r.orderId, 'bad')
    }),
    setReturnStatus: (id, status) => setDb(d => ({ ...d, returns: d.returns.map(r => r.id === id ? { ...r, status } : r) })),
    addMessage: m => setDb(d => {
      const base = log({ ...d, messages: [...d.messages, { ...m, id: uid('ms'), at: new Date().toISOString() }] }, m.from === 'customer' ? `رسالة جديدة من الزبون في ${d.projects.find(p => p.id === m.projectId)?.name}` : 'رد الورشة على رسالة الزبون', undefined, 'info')
      return base
    }),
    addEmployee: e => setDb(d => ({ ...d, employees: [...d.employees, { id: uid('e'), name: e.name, role: e.role, roleLabel: ROLE_LABELS[e.role], phone: e.phone, active: true, color: '#4a6b57' }] })),
    toggleEmployee: id => setDb(d => ({ ...d, employees: d.employees.map(e => e.id === id ? { ...e, active: !e.active } : e) })),
  }), [db, activeProjectId, advance])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

/* ---------- derived helpers ---------- */
export type StageState = 'done' | 'current' | 'pending' | 'rework' | 'rejected'
export function stageState(o: Order, i: number): StageState {
  if (o.stage >= 8) return 'done'
  if (o.rework && i === o.rework.fromStage && i > o.stage) return 'rejected'
  if (i < o.stage) return 'done'
  if (i === o.stage) return o.rework ? 'rework' : 'current'
  return 'pending'
}
export function orderStatus(o: Order): { label: string; tone: 'ok' | 'warn' | 'bad' | 'info' } {
  if (o.stage >= 8) return { label: 'مكتملة', tone: 'ok' }
  if (o.rework) return { label: 'إعادة عمل', tone: 'warn' }
  if (o.estDelivery < daysFrom(0)) return { label: 'متأخرة', tone: 'bad' }
  return { label: 'قيد التنفيذ', tone: 'info' }
}
export const orderProgress = (o: Order) => Math.min(1, o.stage / 8)
export const stageLabel = (o: Order) => o.stage >= 8 ? 'مكتملة' : STAGES[o.stage].label
export const stageKey = (o: Order): StageKey | null => o.stage >= 8 ? null : STAGES[o.stage].key
