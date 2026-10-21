import { useState } from 'react'
import { ClipboardCheck, Phone, Plus, UserPlus } from 'lucide-react'
import { ROLE_LABELS, type EmpRole } from '../types'
import { useStore } from '../store'
import { Avatar, Badge, Btn, Card, Field, Modal, PageHeader, inputCls, useToast } from '../ui'
import { EmpSelect } from '../shared/StagePanel'

export default function Employees() {
  const { db, addEmployee, toggleEmployee, assignTask } = useStore(); const toast = useToast()
  const [add, setAdd] = useState(false); const [f, setF] = useState({ name: '', phone: '', role: 'welder' as EmpRole })
  const [assign, setAssign] = useState(false); const [taskId, setTaskId] = useState(''); const [wid, setWid] = useState<string | null>(null)
  const open = db.tasks.filter(t => t.status !== 'done')
  return (
    <div className="space-y-6">
      <PageHeader title="الموظفون" sub={`${db.employees.filter(e => e.active).length} موظفًا على رأس العمل`} actions={<>
        <Btn variant="secondary" icon={<ClipboardCheck size={18} />} onClick={() => { setAssign(true); setTaskId(open[0]?.id ?? ''); setWid(null) }}>تكليف بمهمة</Btn>
        <Btn icon={<UserPlus size={18} />} onClick={() => setAdd(true)}>إضافة موظف</Btn></>} />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {db.employees.map(e => {
          const mine = db.tasks.filter(t => t.workerId === e.id)
          const doing = mine.filter(t => t.status !== 'done')
          return (
            <Card key={e.id} className={`p-5 ${e.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3"><Avatar name={e.name} color={e.color} size={52} />
                <div className="flex-1"><div className="font-extrabold text-lg">{e.name}</div><div className="text-sm text-mute">{e.roleLabel}</div></div>
                <Badge tone={e.active ? 'ok' : 'neutral'}>{e.active ? 'على رأس العمل' : 'متوقف'}</Badge></div>
              <div className="flex items-center gap-2 text-sm text-mute mt-3"><Phone size={15} /><span dir="ltr">{e.phone}</span></div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-center"><div className="bg-card rounded-xl py-2"><div className="font-extrabold text-xl">{doing.length}</div><div className="text-xs text-mute">مهام جارية</div></div><div className="bg-card rounded-xl py-2"><div className="font-extrabold text-xl">{mine.length - doing.length}</div><div className="text-xs text-mute">مهام منجزة</div></div></div>
              {doing.length > 0 && <div className="mt-3 text-sm space-y-1">{doing.slice(0, 2).map(t => <div key={t.id} className="truncate">• {t.title}</div>)}</div>}
              <button className="mt-3 text-sm font-bold text-brand" onClick={() => { toggleEmployee(e.id); toast(e.active ? 'تم إيقاف الموظف' : 'تم تفعيل الموظف', 'info') }}>{e.active ? 'إيقاف مؤقت' : 'إعادة تفعيل'}</button>
            </Card>
          )
        })}
      </div>

      <Modal open={add} onClose={() => setAdd(false)} title="إضافة موظف جديد" footer={<><Btn variant="secondary" onClick={() => setAdd(false)}>إلغاء</Btn>
        <Btn disabled={!f.name.trim()} icon={<Plus size={18} />} onClick={() => { addEmployee({ ...f, name: f.name.trim(), phone: f.phone || '—' }); setAdd(false); setF({ name: '', phone: '', role: 'welder' }); toast('تمت إضافة الموظف') }}>إضافة</Btn></>}>
        <Field label="الاسم"><input className={inputCls} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="الهاتف"><input className={inputCls} value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
        <Field label="الوظيفة"><select className={inputCls} value={f.role} onChange={e => setF({ ...f, role: e.target.value as EmpRole })}>{Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </Modal>

      <Modal open={assign} onClose={() => setAssign(false)} title="تكليف موظف بمهمة" footer={<><Btn variant="secondary" onClick={() => setAssign(false)}>إلغاء</Btn>
        <Btn disabled={!taskId || !wid} onClick={() => { assignTask(taskId, wid); setAssign(false); toast('تم تكليف الموظف بالمهمة') }}>تكليف</Btn></>}>
        <Field label="المهمة"><select className={inputCls} value={taskId} onChange={e => setTaskId(e.target.value)}>{open.map(t => <option key={t.id} value={t.id}>{t.orderId} — {t.title}</option>)}</select></Field>
        <Field label="الموظف"><EmpSelect value={wid} onChange={setWid} /></Field>
      </Modal>
    </div>
  )
}
