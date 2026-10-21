import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Btn, Field, Modal, inputCls, useToast } from '../ui'

export function ReturnModal({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId?: string }) {
  const { db, addReturn } = useStore()
  const toast = useToast()
  const [oid, setOid] = useState(orderId ?? '')
  const [type, setType] = useState<'return' | 'rework'>('rework')
  const [reason, setReason] = useState('')
  const [back, setBack] = useState<'none' | 'manufacturing' | 'installation'>('manufacturing')
  useEffect(() => { if (open) { setOid(orderId ?? db.orders.find(o => o.stage >= 6)?.id ?? db.orders[0].id); setReason('') } }, [open]) // eslint-disable-line
  const submit = () => {
    addReturn({ orderId: oid, reason: reason.trim(), type, source: 'admin', sendBackTo: back })
    toast('تم إنشاء الطلب وإرسال الطلبية للمرحلة المناسبة', 'warn'); onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="إنشاء طلب مرتجع / إعادة عمل"
      footer={<><Btn variant="secondary" onClick={onClose}>إلغاء</Btn><Btn variant="warn" disabled={!reason.trim() || !oid} onClick={submit}>إنشاء الطلب</Btn></>}>
      <Field label="الطلبية">
        <select className={inputCls} value={oid} onChange={e => setOid(e.target.value)} disabled={!!orderId}>
          {db.orders.map(o => <option key={o.id} value={o.id}>{o.id} — {o.title}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {([['rework', 'إعادة عمل / تعديل'], ['return', 'مرتجع']] as const).map(([v, l]) =>
          <button key={v} onClick={() => setType(v)} className={`h-12 rounded-xl font-bold border-2 ${type === v ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white'}`}>{l}</button>)}
      </div>
      <Field label="سبب الطلب"><textarea className={`${inputCls} h-24 py-2`} value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: الزبون طلب تعديل ارتفاع البوابة 10 سم" /></Field>
      <Field label="إعادة الطلبية إلى مرحلة">
        <select className={inputCls} value={back} onChange={e => setBack(e.target.value as typeof back)}>
          <option value="manufacturing">التصنيع (إعادة عمل في الورشة)</option>
          <option value="installation">التركيب (إعادة تركيب)</option>
          <option value="none">بدون تغيير مرحلة الطلبية</option>
        </select>
      </Field>
    </Modal>
  )
}
