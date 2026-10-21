import { useRef, useState } from 'react'
import { Camera, Eye, EyeOff, ImagePlus, MessageSquarePlus, StickyNote, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { ago, mockPhoto, type PhotoKind } from '../mock'
import { Btn, Badge, Field, Modal, inputCls, readFile, useToast } from '../ui'
import { STAGES, type Order, type StageKey } from '../types'

const DEMO_KINDS: Record<StageKey, PhotoKind[]> = {
  survey: ['site'], order: ['site'], measurements: ['site'], manufacturing: ['weld', 'gate', 'paint'], transport: ['truck'], quality: ['gate', 'weld'], installation: ['gate', 'door'], delivery: ['gate', 'door'],
}

export function StageMedia({ order, stage, by = 'مدير الورشة' }: { order: Order; stage: number; by?: string }) {
  const { db, addPhoto, togglePhoto, addNote } = useStore()
  const toast = useToast()
  const key = STAGES[Math.min(stage, 7)].key
  const photos = db.photos.filter(p => p.orderId === order.id && p.stage === key)
  const notes = db.notes.filter(n => n.orderId === order.id && n.stage === key)
  const fileRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(false)
  const [src, setSrc] = useState('')
  const [note, setNote] = useState('')
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<string | null>(null)
  const [general, setGeneral] = useState('')

  const open = () => { setAdding(true); setSrc(''); setNote(''); setVisible(false) }
  const save = () => {
    addPhoto({ orderId: order.id, stage: key, src, note, visible, by })
    setAdding(false); toast('تمت إضافة الصورة إلى معرض المرحلة')
  }
  const demoPhoto = () => {
    const ks = DEMO_KINDS[key]; setSrc(mockPhoto(ks[photos.length % ks.length], photos.length + 1))
  }
  const sendNote = () => {
    if (!general.trim()) return
    addNote({ orderId: order.id, stage: key, text: general.trim(), by }); setGeneral(''); toast('تم حفظ الملاحظة')
  }
  const viewing = photos.find(p => p.id === view)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-extrabold flex items-center gap-2"><Camera size={18} className="text-brand" />صور المرحلة <Badge>{photos.length}</Badge></h4>
          <Btn size="sm" variant="soft" icon={<ImagePlus size={16} />} onClick={open}>إضافة صورة</Btn>
        </div>
        {photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-5 text-center text-mute text-sm">لا توجد صور لهذه المرحلة بعد — اضغط «إضافة صورة» لتوثيق العمل.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map(p => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-line bg-white">
                <button onClick={() => setView(p.id)} className="block w-full aspect-[4/3] bg-card"><img src={p.src} alt={p.note || 'صورة'} className="w-full h-full object-cover" /></button>
                <div className="p-2 space-y-1.5">
                  <div className="text-xs text-ink line-clamp-2 min-h-[2rem]">{p.note || <span className="text-mute">بدون ملاحظة</span>}</div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-mute">{p.by} · {ago(p.at)}</span>
                  </div>
                  <button onClick={() => { togglePhoto(p.id); toast(p.visible ? 'أصبحت الصورة مخفية عن الزبون' : 'أصبحت الصورة ظاهرة للزبون', 'info') }}
                    className={`w-full h-8 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 ${p.visible ? 'bg-brand-soft text-brand-dark' : 'bg-card text-mute'}`}>
                    {p.visible ? <><Eye size={14} />ظاهرة للزبون</> : <><EyeOff size={14} />مخفية عن الزبون</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="font-extrabold flex items-center gap-2 mb-3"><StickyNote size={18} className="text-warn" />ملاحظات المرحلة</h4>
        <div className="space-y-2 mb-3">
          {notes.length === 0 && <div className="text-sm text-mute">لا توجد ملاحظات بعد.</div>}
          {notes.map(n => (
            <div key={n.id} className="bg-warn-soft/60 rounded-xl p-3 fade-up">
              <div className="text-sm">{n.text}</div>
              <div className="text-xs text-mute mt-1">{n.by} · {ago(n.at)}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={inputCls} placeholder="اكتب ملاحظة عامة عن هذه المرحلة…" value={general} onChange={e => setGeneral(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendNote()} />
          <Btn variant="secondary" icon={<MessageSquarePlus size={18} />} onClick={sendNote} disabled={!general.trim()}>إضافة ملاحظة</Btn>
        </div>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="إضافة صورة"
        footer={<><Btn variant="secondary" onClick={() => setAdding(false)}>إلغاء</Btn><Btn disabled={!src} onClick={save}>حفظ الصورة</Btn></>}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setSrc(await readFile(f)); e.target.value = '' }} />
        {src ? (
          <img src={src} alt="معاينة" className="w-full max-h-64 object-contain rounded-xl bg-card" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => fileRef.current?.click()} className="rounded-2xl border-2 border-dashed border-brand/50 bg-brand-soft/50 p-6 text-center hover:bg-brand-soft"><ImagePlus className="mx-auto text-brand mb-2" size={32} /><div className="font-bold">اختيار صورة من الجهاز</div></button>
            <button onClick={demoPhoto} className="rounded-2xl border-2 border-dashed border-line p-6 text-center hover:bg-card"><Sparkles className="mx-auto text-warn mb-2" size={32} /><div className="font-bold">استخدام صورة تجريبية</div><div className="text-xs text-mute mt-1">للعرض السريع</div></button>
          </div>
        )}
        {src && <button className="text-sm text-brand font-bold" onClick={() => setSrc('')}>تغيير الصورة</button>}
        <Field label="ملاحظة على هذه الصورة (اختياري)"><textarea className={`${inputCls} h-24 py-2`} value={note} onChange={e => setNote(e.target.value)} placeholder="مثال: بعد اللحام وقبل الدهان" /></Field>
        <label className="flex items-center gap-3 bg-card rounded-xl p-3 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 accent-[#4a6b57]" checked={visible} onChange={e => setVisible(e.target.checked)} />
          <span className="font-bold">إظهار هذه الصورة للزبون</span>
        </label>
      </Modal>

      <Modal open={!!viewing} onClose={() => setView(null)} title="الصورة">
        {viewing && <><img src={viewing.src} alt="" className="w-full rounded-xl" /><p className="text-base">{viewing.note || 'بدون ملاحظة'}</p><p className="text-xs text-mute">{viewing.by} · {ago(viewing.at)}</p></>}
      </Modal>
    </div>
  )
}
