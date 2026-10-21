import type { DB, Order, Employee, Photo, Task, Kind, StageKey } from './types'

let _n = 1000
export const uid = (p = 'x') => `${p}${++_n}${Math.floor(Math.random() * 900 + 100)}`

const pad = (n: number) => String(n).padStart(2, '0')
export function daysFrom(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const todayStr = () => daysFrom(0)
const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول']
export function fmtDate(s: string) {
  if (!s) return '—'
  const [y, m, d] = s.split('-').map(Number)
  const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()) / 86400000)
  if (diff === 0) return 'اليوم'
  if (diff === 1) return 'غدًا'
  return `${d} ${MONTHS[m - 1]}${y !== new Date().getFullYear() ? ' ' + y : ''}`
}
export const fmtMoney = (n: number) => `${n.toLocaleString('en-US')} ₪`
const plural = (n: number, one: string, two: string, few: string, many: string) => n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`
export function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'الآن'
  if (m < 60) return 'منذ ' + plural(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')
  const h = Math.round(m / 60)
  if (h < 24) return 'منذ ' + plural(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة')
  const d = Math.round(h / 24)
  return 'منذ ' + plural(d, 'يوم', 'يومين', 'أيام', 'يومًا')
}
const mins = (m: number) => new Date(Date.now() - m * 60000).toISOString()

/* ---------- mock photos (SVG illustrations) ---------- */
export type PhotoKind = Kind | 'site' | 'weld' | 'truck' | 'paint'
const svgUri = (s: string) => 'data:image/svg+xml;utf8,' + encodeURIComponent(s)
const steel = '#3d4448', steel2 = '#5a6369'
const range = (a: number, b: number, step: number) => { const r: number[] = []; for (let i = a; i <= b; i += step) r.push(i); return r }

export function mockPhoto(kind: PhotoKind, tone = 0): string {
  const bgs = ['#e8e2d6', '#dfe5df', '#ebe0d2', '#d9dfe3']
  let bg = bgs[tone % bgs.length]
  let g = ''
  switch (kind) {
    case 'gate':
      g = `<rect x="110" y="100" width="580" height="380" fill="none" stroke="${steel}" stroke-width="16"/><line x1="400" y1="100" x2="400" y2="480" stroke="${steel}" stroke-width="12"/>` +
        range(160, 650, 40).filter(x => x !== 400).map(x => `<line x1="${x}" y1="108" x2="${x}" y2="472" stroke="${steel2}" stroke-width="7"/>`).join('') +
        `<line x1="110" y1="290" x2="690" y2="290" stroke="${steel}" stroke-width="10"/><circle cx="370" cy="290" r="10" fill="#d9822b"/><circle cx="430" cy="290" r="10" fill="#d9822b"/>`
      break
    case 'rail':
      g = `<line x1="100" y1="440" x2="700" y2="190" stroke="${steel}" stroke-width="16"/><line x1="100" y1="480" x2="700" y2="230" stroke="${steel}" stroke-width="8"/>` +
        range(140, 680, 44).map(x => { const y = 440 - (x - 100) * (250 / 600); return `<line x1="${x}" y1="${y + 6}" x2="${x}" y2="${y + 46}" stroke="${steel2}" stroke-width="7"/>` }).join('') +
        `<rect x="90" y="190" width="14" height="300" fill="${steel}"/><rect x="696" y="140" width="14" height="350" fill="${steel}"/>`
      break
    case 'window':
      g = `<rect x="170" y="100" width="460" height="360" fill="#cfd9df" stroke="${steel}" stroke-width="18"/>` +
        `<line x1="400" y1="100" x2="400" y2="460" stroke="${steel}" stroke-width="12"/><line x1="170" y1="280" x2="630" y2="280" stroke="${steel}" stroke-width="12"/>` +
        range(220, 580, 60).filter(x => Math.abs(x - 400) > 20).map(x => `<line x1="${x}" y1="110" x2="${x}" y2="450" stroke="${steel2}" stroke-width="5"/>`).join('')
      break
    case 'door':
      g = `<rect x="230" y="80" width="340" height="400" fill="#6a7479" stroke="${steel}" stroke-width="18"/><rect x="270" y="120" width="260" height="140" fill="none" stroke="#8d979c" stroke-width="6"/><rect x="270" y="290" width="260" height="150" fill="none" stroke="#8d979c" stroke-width="6"/><rect x="520" y="270" width="16" height="70" rx="6" fill="#d9822b"/>`
      break
    case 'fence':
      g = `<line x1="60" y1="330" x2="740" y2="330" stroke="${steel}" stroke-width="12"/><line x1="60" y1="430" x2="740" y2="430" stroke="${steel}" stroke-width="12"/>` +
        range(80, 730, 38).map(x => `<line x1="${x}" y1="260" x2="${x}" y2="480" stroke="${steel2}" stroke-width="8"/><polygon points="${x - 9},262 ${x + 9},262 ${x},232" fill="${steel}"/>`).join('')
      break
    case 'sign':
      g = `<rect x="140" y="110" width="520" height="200" fill="none" stroke="${steel}" stroke-width="14"/><line x1="140" y1="210" x2="660" y2="210" stroke="${steel2}" stroke-width="6"/><rect x="200" y="310" width="14" height="170" fill="${steel}"/><rect x="586" y="310" width="14" height="170" fill="${steel}"/>` +
        range(200, 620, 60).map(x => `<line x1="${x}" y1="120" x2="${x + 40}" y2="300" stroke="${steel2}" stroke-width="5"/>`).join('')
      break
    case 'stairs':
      g = range(0, 5, 1).map(i => `<rect x="${130 + i * 90}" y="${420 - i * 55}" width="100" height="14" fill="${steel}"/><line x1="${130 + i * 90}" y1="${434 - i * 55}" x2="${130 + i * 90}" y2="${480}" stroke="${steel2}" stroke-width="6"/>`).join('') +
        `<line x1="120" y1="400" x2="690" y2="125" stroke="${steel}" stroke-width="12"/>`
      break
    case 'site':
      g = `<rect x="160" y="150" width="480" height="330" fill="#d8cfbd" stroke="#8a8272" stroke-width="6"/><rect x="230" y="210" width="110" height="130" fill="#b9c6cd" stroke="#8a8272" stroke-width="5"/><rect x="460" y="320" width="120" height="160" fill="#a7926c"/>` +
        `<line x1="160" y1="520" x2="640" y2="520" stroke="#c0392b" stroke-width="6"/>` + range(160, 640, 40).map(x => `<line x1="${x}" y1="510" x2="${x}" y2="530" stroke="#c0392b" stroke-width="4"/>`).join('')
      break
    case 'weld':
      bg = '#2b2d2f'
      g = `<rect x="120" y="330" width="560" height="40" fill="${steel2}"/><rect x="120" y="300" width="40" height="110" fill="${steel2}"/><rect x="640" y="300" width="40" height="110" fill="${steel2}"/>` +
        `<circle cx="400" cy="320" r="46" fill="#f6b25c" opacity=".35"/><circle cx="400" cy="320" r="22" fill="#f6b25c"/>` +
        [[330, 250], [470, 240], [380, 210], [440, 280], [520, 300], [290, 290]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#f4a24a"/>`).join('')
      break
    case 'truck':
      g = `<rect x="120" y="190" width="400" height="230" fill="#8a8f93" stroke="${steel}" stroke-width="8"/><rect x="520" y="260" width="170" height="160" fill="#4a6b57" stroke="${steel}" stroke-width="8"/><rect x="560" y="280" width="100" height="60" fill="#cfd9df"/>` +
        `<circle cx="220" cy="430" r="40" fill="${steel}"/><circle cx="600" cy="430" r="40" fill="${steel}"/><circle cx="220" cy="430" r="14" fill="#bbb"/><circle cx="600" cy="430" r="14" fill="#bbb"/>` +
        `<line x1="170" y1="230" x2="470" y2="230" stroke="${steel}" stroke-width="10"/><line x1="170" y1="280" x2="470" y2="280" stroke="${steel}" stroke-width="10"/>`
      break
    case 'paint':
      g = `<rect x="110" y="100" width="580" height="380" fill="none" stroke="#4a6b57" stroke-width="18"/>` +
        range(160, 650, 40).map(x => `<line x1="${x}" y1="108" x2="${x}" y2="472" stroke="#6b8f78" stroke-width="8"/>`).join('') +
        `<line x1="110" y1="290" x2="690" y2="290" stroke="#4a6b57" stroke-width="12"/><rect x="40" y="480" width="720" height="14" fill="#8a8272"/>`
      break
  }
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><rect y="490" width="800" height="110" fill="#0000001a"/>${g}</svg>`)
}

/* ---------- seed ---------- */
const emp = (id: string, name: string, role: Employee['role'], roleLabel: string, phone: string, color: string): Employee => ({ id, name, role, roleLabel, phone, active: true, color })

function order(p: Partial<Order> & Pick<Order, 'id' | 'projectId' | 'title' | 'kind' | 'stage'>): Order {
  return {
    description: '', price: 3000, deposit: 1500, estDelivery: daysFrom(10),
    surveyDate: daysFrom(-14), surveyorId: 'e6', measures: [],
    transport: { status: 'planned', dest: 'workshop', factory: '', driverId: null, vehicle: 'شاحنة صغيرة — 4 طن' },
    quality: { checks: [false, false, false, false], status: 'pending', note: '' },
    install: { date: '', teamId: null }, delivery: { status: 'pending' }, rework: null, createdAt: mins(60 * 24 * 12),
    ...p,
  }
}

export function seed(): DB {
  const employees: Employee[] = [
    emp('e1', 'محمود حسن', 'welder', ROLE_L.welder, '0599-123-456', '#4a6b57'),
    emp('e2', 'خالد عودة', 'cutter', ROLE_L.cutter, '0598-221-334', '#50697a'),
    emp('e3', 'يوسف أبو سعد', 'painter', ROLE_L.painter, '0597-554-102', '#d9822b'),
    emp('e4', 'عمر زيدان', 'driver', ROLE_L.driver, '0599-778-231', '#7a6a50'),
    emp('e5', 'إبراهيم القاسم', 'qc', ROLE_L.qc, '0568-912-440', '#3b5746'),
    emp('e6', 'نادر الخطيب', 'surveyor', ROLE_L.surveyor, '0569-318-775', '#8a5a44'),
    emp('e7', 'سليم جابر', 'installer', 'رئيس فريق التركيب', '0597-660-908', '#5a6369'),
    emp('e8', 'رامي سلامة', 'installer', ROLE_L.installer, '0595-102-847', '#6b6f73'),
  ]

  const projects = [
    { id: 'p1', name: 'مشروع فيلا أحمد', customer: 'أحمد محمد', phone: '0599-400-111', location: 'رام الله', createdAt: mins(60 * 24 * 12), estDelivery: daysFrom(21) },
    { id: 'p2', name: 'مشروع مكتب أحمد', customer: 'أحمد محمد', phone: '0599-400-111', location: 'البيرة', createdAt: mins(60 * 24 * 30), estDelivery: daysFrom(2) },
    { id: 'p3', name: 'مشروع محل الأمين', customer: 'سامي الأمين', phone: '0597-300-222', location: 'نابلس', createdAt: mins(60 * 24 * 18), estDelivery: daysFrom(6) },
    { id: 'p4', name: 'مشروع عمارة الندى', customer: 'شركة الندى للمقاولات', phone: '09-2380-555', location: 'طولكرم', createdAt: mins(60 * 24 * 25), estDelivery: daysFrom(25) },
    { id: 'p5', name: 'مشروع مزرعة الزيتون', customer: 'خالد صالح', phone: '0598-650-909', location: 'جنين', createdAt: mins(60 * 24 * 60), estDelivery: daysFrom(-20) },
  ]

  const T = { welder: 'e1' }
  void T
  const orders: Order[] = [
    order({ id: 'ORD-001', projectId: 'p1', title: 'تصنيع وتركيب بوابة حديد', kind: 'gate', stage: 3, price: 4800, deposit: 2400, estDelivery: daysFrom(9),
      description: 'بوابة مزدوجة الجناح 3 م × 2.2 م بزخرفة بسيطة، سماكة الحديد 4 ملم، لون أسود مطفي.',
      measures: [{ id: 'm1', item: 'جناح البوابة', w: 150, h: 220, qty: 2 }, { id: 'm2', item: 'العمود الجانبي', w: 12, h: 240, qty: 2 }] }),
    order({ id: 'ORD-002', projectId: 'p1', title: 'تصنيع درابزين درج', kind: 'rail', stage: 2, price: 6200, deposit: 3100, estDelivery: daysFrom(14),
      description: 'درابزين لدرج داخلي بطول 5.4 م مع مسكة علوية، تصميم عصري بقوائم رفيعة.',
      measures: [{ id: 'm3', item: 'الطول الكلي للدرابزين', w: 540, h: 100, qty: 1 }] }),
    order({ id: 'ORD-003', projectId: 'p1', title: 'تصنيع شبابيك حديد', kind: 'window', stage: 1, price: 3900, deposit: 1000, estDelivery: daysFrom(21),
      description: '6 شبابيك حديد بأحجام مختلفة مع شبك حماية، دهان أبيض.' }),
    order({ id: 'ORD-004', projectId: 'p2', title: 'تصنيع وتركيب باب حديد للمكتب', kind: 'door', stage: 7, price: 2100, deposit: 1050, estDelivery: daysFrom(0),
      description: 'باب أمان حديد مع قفل ثلاثي النقاط ودهان رمادي.',
      measures: [{ id: 'm4', item: 'الباب', w: 100, h: 215, qty: 1 }],
      transport: { status: 'arrived', dest: 'workshop', factory: '', driverId: 'e4', vehicle: 'شاحنة صغيرة — 4 طن' },
      quality: { checks: [true, true, true, true], status: 'approved', note: 'ممتاز' },
      install: { date: daysFrom(-1), teamId: 'e7' }, delivery: { status: 'awaiting' } }),
    order({ id: 'ORD-005', projectId: 'p2', title: 'تصنيع وتركيب سياج حديقة', kind: 'fence', stage: 6, price: 3400, deposit: 1700, estDelivery: daysFrom(2),
      description: 'سياج بطول 18 م بقوائم مدببة، دهان أخضر داكن.',
      measures: [{ id: 'm5', item: 'السياج الأمامي', w: 1200, h: 120, qty: 1 }, { id: 'm6', item: 'السياج الجانبي', w: 600, h: 120, qty: 1 }],
      transport: { status: 'arrived', dest: 'workshop', factory: '', driverId: 'e4', vehicle: 'شاحنة كبيرة — 10 طن' },
      quality: { checks: [true, true, true, true], status: 'approved', note: 'تم الفحص' },
      install: { date: daysFrom(1), teamId: 'e7' } }),
    order({ id: 'ORD-006', projectId: 'p3', title: 'تصنيع هيكل لافتة المحل', kind: 'sign', stage: 4, price: 2800, deposit: 1400, estDelivery: daysFrom(4),
      description: 'هيكل لافتة 4 م × 1.2 م مع قواعد تثبيت، دهان إلكتروستاتيكي.',
      measures: [{ id: 'm7', item: 'هيكل اللافتة', w: 400, h: 120, qty: 1 }],
      transport: { status: 'transit', dest: 'factory', factory: 'مصنع الأفق للدهان الإلكتروستاتيكي — نابلس', driverId: 'e4', vehicle: 'شاحنة صغيرة — 4 طن' } }),
    order({ id: 'ORD-007', projectId: 'p3', title: 'تصنيع باب حديد للمستودع', kind: 'door', stage: 5, price: 1900, deposit: 950, estDelivery: daysFrom(6),
      description: 'باب مستودع مقوّى 1.4 م × 2.4 م مع مفصلات ثقيلة.',
      measures: [{ id: 'm8', item: 'الباب', w: 140, h: 240, qty: 1 }],
      transport: { status: 'arrived', dest: 'workshop', factory: '', driverId: 'e4', vehicle: 'شاحنة صغيرة — 4 طن' },
      quality: { checks: [true, true, false, false], status: 'pending', note: '' } }),
    order({ id: 'ORD-008', projectId: 'p4', title: 'تصنيع سلالم طوارئ حديد', kind: 'stairs', stage: 0, price: 18500, deposit: 5000, estDelivery: daysFrom(25),
      description: 'سلالم طوارئ خارجية لعمارة من 4 طوابق مع درابزين وحماية.', surveyDate: daysFrom(1) }),
    order({ id: 'ORD-009', projectId: 'p4', title: 'تصنيع بوابة مرآب', kind: 'gate', stage: 3, price: 5200, deposit: 2600, estDelivery: daysFrom(-1),
      description: 'بوابة مرآب منزلقة 4 م × 2.5 م.',
      measures: [{ id: 'm9', item: 'جناح البوابة', w: 400, h: 250, qty: 1 }],
      transport: { status: 'arrived', dest: 'workshop', factory: '', driverId: 'e4', vehicle: 'شاحنة كبيرة — 10 طن' },
      quality: { checks: [true, false, true, true], status: 'rejected', note: 'لحام المفصلات غير متين' },
      rework: { reason: 'لحام المفصلات غير متين ويحتاج إعادة', fromStage: 5, at: mins(60 * 5) } }),
    order({ id: 'ORD-010', projectId: 'p5', title: 'تصنيع وتركيب بوابة مزرعة', kind: 'gate', stage: 8, price: 4300, deposit: 4300, estDelivery: daysFrom(-20),
      description: 'بوابة مزرعة مزدوجة 5 م مع قفل سلسلة.',
      measures: [{ id: 'm10', item: 'جناح البوابة', w: 250, h: 200, qty: 2 }],
      transport: { status: 'arrived', dest: 'workshop', factory: '', driverId: 'e4', vehicle: 'شاحنة كبيرة — 10 طن' },
      quality: { checks: [true, true, true, true], status: 'approved', note: 'ممتاز' },
      install: { date: daysFrom(-22), teamId: 'e7' }, delivery: { status: 'accepted' } }),
  ]

  const tk = (t: Partial<Task> & Pick<Task, 'id' | 'orderId' | 'title'>): Task => ({ workerId: null, status: 'todo', stage: 'manufacturing', due: daysFrom(1), ...t })
  const tasks: Task[] = [
    tk({ id: 't1', orderId: 'ORD-001', title: 'قص وتجهيز حديد بوابة حديد', workerId: 'e2', status: 'done', doneAt: mins(60 * 26), due: daysFrom(-1) }),
    tk({ id: 't2', orderId: 'ORD-001', title: 'لحام بوابة حديد', workerId: 'e1', status: 'todo', due: daysFrom(0), hint: 'انتبه: سماكة الحديد 4 ملم، والأجنحة متماثلة.' }),
    tk({ id: 't3', orderId: 'ORD-001', title: 'دهان وتشطيب بوابة حديد', workerId: 'e3', status: 'todo', due: daysFrom(2) }),
    tk({ id: 't4', orderId: 'ORD-009', title: 'قص حديد بوابة مرآب', workerId: 'e2', status: 'done', doneAt: mins(60 * 24 * 6), due: daysFrom(-7) }),
    tk({ id: 't5', orderId: 'ORD-009', title: 'لحام بوابة مرآب', workerId: 'e1', status: 'done', doneAt: mins(60 * 24 * 4), due: daysFrom(-5) }),
    tk({ id: 't6', orderId: 'ORD-009', title: 'إعادة لحام مفصلات بوابة المرآب', workerId: 'e1', status: 'todo', urgent: true, due: daysFrom(0), hint: 'مطلوب من الجودة: لحام كامل حول المفصلة وتنعيم السطح.' }),
    tk({ id: 't7', orderId: 'ORD-009', title: 'دهان وتشطيب بوابة مرآب', workerId: 'e3', status: 'done', doneAt: mins(60 * 24 * 3), due: daysFrom(-3) }),
    tk({ id: 't8', orderId: 'ORD-005', title: 'تركيب سياج حديقة', workerId: 'e8', status: 'todo', stage: 'installation', due: daysFrom(1) }),
  ]

  const ph = (orderId: string, stage: StageKey, kind: PhotoKind, tone: number, note: string, visible: boolean, minsAgo: number, by: string): Photo =>
    ({ id: uid('ph'), orderId, stage, src: mockPhoto(kind, tone), note, visible, by, at: mins(minsAgo) })
  const photos: Photo[] = [
    ph('ORD-001', 'survey', 'site', 0, 'مكان البوابة عند مدخل الفيلا', true, 60 * 24 * 11, 'نادر الخطيب'),
    ph('ORD-001', 'measurements', 'site', 1, 'أخذ عرض المدخل 3 متر', true, 60 * 24 * 9, 'نادر الخطيب'),
    ph('ORD-001', 'manufacturing', 'gate', 2, 'بعد قص وتجهيز الإطار', true, 60 * 26, 'خالد عودة'),
    ph('ORD-001', 'manufacturing', 'weld', 0, 'بداية اللحام', false, 60 * 3, 'محمود حسن'),
    ph('ORD-002', 'survey', 'site', 3, 'موقع الدرج الداخلي', true, 60 * 24 * 8, 'نادر الخطيب'),
    ph('ORD-002', 'measurements', 'rail', 1, 'قياس طول الدرج', true, 60 * 24 * 2, 'نادر الخطيب'),
    ph('ORD-003', 'survey', 'window', 2, 'الشبابيك القديمة المراد استبدالها', true, 60 * 24 * 5, 'نادر الخطيب'),
    ph('ORD-004', 'survey', 'site', 0, 'مدخل المكتب', true, 60 * 24 * 28, 'نادر الخطيب'),
    ph('ORD-004', 'manufacturing', 'door', 1, 'الباب بعد اللحام', true, 60 * 24 * 14, 'محمود حسن'),
    ph('ORD-004', 'manufacturing', 'paint', 0, 'طبقة الدهان الأساس', false, 60 * 24 * 12, 'يوسف أبو سعد'),
    ph('ORD-004', 'transport', 'truck', 2, 'تحميل الباب للنقل', false, 60 * 24 * 4, 'عمر زيدان'),
    ph('ORD-004', 'installation', 'door', 3, 'الباب بعد التركيب', true, 60 * 26, 'سليم جابر'),
    ph('ORD-004', 'delivery', 'door', 1, 'الباب جاهز للاستلام', true, 60 * 5, 'سليم جابر'),
    ph('ORD-005', 'survey', 'site', 3, 'حدود الحديقة', true, 60 * 24 * 20, 'نادر الخطيب'),
    ph('ORD-005', 'manufacturing', 'fence', 1, 'قوائم السياج جاهزة', true, 60 * 24 * 8, 'محمود حسن'),
    ph('ORD-005', 'quality', 'fence', 0, 'فحص الدهان', false, 60 * 24 * 3, 'إبراهيم القاسم'),
    ph('ORD-006', 'manufacturing', 'sign', 2, 'هيكل اللافتة بعد اللحام', true, 60 * 24 * 3, 'محمود حسن'),
    ph('ORD-006', 'transport', 'truck', 0, 'في الطريق إلى مصنع الدهان', false, 60 * 2, 'عمر زيدان'),
    ph('ORD-007', 'manufacturing', 'door', 3, 'الباب قبل الدهان', false, 60 * 24 * 4, 'محمود حسن'),
    ph('ORD-008', 'survey', 'stairs', 1, 'مخطط السلالم المقترح', false, 60 * 24 * 2, 'نادر الخطيب'),
    ph('ORD-009', 'manufacturing', 'gate', 0, 'بوابة المرآب قبل التسليم للجودة', true, 60 * 24 * 5, 'محمود حسن'),
    ph('ORD-009', 'quality', 'weld', 1, 'لحام المفصلة يحتاج إعادة', false, 60 * 5, 'إبراهيم القاسم'),
    ph('ORD-010', 'installation', 'gate', 2, 'البوابة بعد التركيب', true, 60 * 24 * 22, 'سليم جابر'),
    ph('ORD-010', 'delivery', 'gate', 1, 'تسليم البوابة', true, 60 * 24 * 20, 'سليم جابر'),
  ]

  const notes = [
    { id: uid('n'), orderId: 'ORD-001', stage: 'manufacturing' as StageKey, text: 'تم قص الحديد حسب القياسات، بقي اللحام والدهان.', by: 'خالد عودة', at: mins(60 * 26) },
    { id: uid('n'), orderId: 'ORD-001', stage: 'measurements' as StageKey, text: 'الزبون طلب لون أسود مطفي بدل الأسود اللامع.', by: 'نادر الخطيب', at: mins(60 * 24 * 9) },
    { id: uid('n'), orderId: 'ORD-009', stage: 'quality' as StageKey, text: 'المفصلة العلوية ضعيفة اللحام، يجب إعادتها قبل أي دهان.', by: 'إبراهيم القاسم', at: mins(60 * 5) },
    { id: uid('n'), orderId: 'ORD-006', stage: 'transport' as StageKey, text: 'السائق عمر في الطريق، الوصول المتوقع خلال ساعة.', by: 'عمر زيدان', at: mins(60 * 2) },
  ]

  return {
    employees, projects, orders, tasks, photos, notes,
    problems: [{ id: 'pr1', orderId: 'ORD-001', taskId: 't3', kind: 'مواد ناقصة', text: 'لون الدهان الأسود المطفي غير متوفر في المخزن.', by: 'يوسف أبو سعد', at: mins(90), resolved: false }],
    returns: [
      { id: 'r1', orderId: 'ORD-009', reason: 'لحام المفصلات غير متين ويحتاج إعادة', type: 'rework', status: 'inprogress', createdAt: mins(60 * 5), source: 'quality' },
      { id: 'r2', orderId: 'ORD-010', reason: 'خدش بسيط في دهان البوابة بعد التركيب', type: 'return', status: 'resolved', createdAt: mins(60 * 24 * 15), source: 'customer' },
    ],
    messages: [
      { id: 'ms1', projectId: 'p1', from: 'customer', text: 'هل ممكن نغيّر لون البوابة إلى أسود مطفي؟', at: mins(60 * 24 * 2) },
      { id: 'ms2', projectId: 'p1', from: 'workshop', text: 'أكيد يا أستاذ أحمد، تم تعديل اللون إلى أسود مطفي بدون أي تكلفة إضافية.', at: mins(60 * 24) },
    ],
    activity: [
      { id: 'a1', text: 'ORD-009: رفضت الجودة البوابة وأعيدت للتصنيع', at: mins(60 * 5), orderId: 'ORD-009', tone: 'bad' },
      { id: 'a2', text: 'ORD-004: جاهزة للاستلام وبانتظار موافقة الزبون', at: mins(60 * 5), orderId: 'ORD-004', tone: 'ok' },
      { id: 'a3', text: 'ORD-006: بدأ نقل القطع إلى مصنع الدهان', at: mins(60 * 2), orderId: 'ORD-006', tone: 'info' },
      { id: 'a4', text: 'ORD-001: أبلغ يوسف عن نقص في مادة الدهان', at: mins(90), orderId: 'ORD-001', tone: 'warn' },
      { id: 'a5', text: 'ORD-001: أنهى خالد قص وتجهيز الحديد', at: mins(60 * 26), orderId: 'ORD-001', tone: 'ok' },
      { id: 'a6', text: 'تم إنشاء مشروع عمارة الندى', at: mins(60 * 24 * 25), tone: 'info' },
    ],
  }
}

// label helper used by seed
const ROLE_L = { welder: 'لحّام', cutter: 'عامل قص وتشكيل', painter: 'عامل دهان وتشطيب', driver: 'سائق', qc: 'مسؤول الجودة', surveyor: 'فني مسح وقياس', installer: 'فني تركيب' }
