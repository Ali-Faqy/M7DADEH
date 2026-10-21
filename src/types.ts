export type StageKey = 'survey' | 'order' | 'measurements' | 'manufacturing' | 'transport' | 'quality' | 'installation' | 'delivery'

export const STAGES: { key: StageKey; label: string; cust: string; path: string }[] = [
  { key: 'survey', label: 'المسح الميداني', cust: 'معاينة الموقع', path: 'survey' },
  { key: 'order', label: 'اعتماد الطلبية', cust: 'تأكيد الطلب', path: 'orders' },
  { key: 'measurements', label: 'القياسات', cust: 'أخذ القياسات', path: 'measurements' },
  { key: 'manufacturing', label: 'التصنيع', cust: 'التصنيع في الورشة', path: 'manufacturing' },
  { key: 'transport', label: 'النقل', cust: 'النقل', path: 'transport' },
  { key: 'quality', label: 'مراقبة الجودة', cust: 'فحص الجودة', path: 'quality' },
  { key: 'installation', label: 'التركيب', cust: 'التركيب', path: 'installation' },
  { key: 'delivery', label: 'التسليم النهائي', cust: 'التسليم والاستلام', path: 'delivery' },
]

export type Kind = 'gate' | 'rail' | 'window' | 'door' | 'fence' | 'sign' | 'stairs'
export const KINDS: Record<Kind, { label: string; noun: string }> = {
  gate: { label: 'بوابة حديد', noun: 'بوابة حديد' },
  rail: { label: 'درابزين', noun: 'درابزين' },
  window: { label: 'شبابيك حديد', noun: 'شبابيك حديد' },
  door: { label: 'باب حديد', noun: 'باب حديد' },
  fence: { label: 'سياج حديد', noun: 'سياج حديد' },
  sign: { label: 'هيكل لافتة', noun: 'هيكل لافتة' },
  stairs: { label: 'سلالم حديد', noun: 'سلالم حديد' },
}

export type EmpRole = 'welder' | 'cutter' | 'painter' | 'driver' | 'qc' | 'surveyor' | 'installer'
export const ROLE_LABELS: Record<EmpRole, string> = {
  welder: 'لحّام', cutter: 'عامل قص وتشكيل', painter: 'عامل دهان وتشطيب', driver: 'سائق',
  qc: 'مسؤول الجودة', surveyor: 'فني مسح وقياس', installer: 'فني تركيب',
}

export interface Employee { id: string; name: string; role: EmpRole; roleLabel: string; phone: string; active: boolean; color: string }
export interface Project { id: string; name: string; customer: string; phone: string; location: string; createdAt: string; estDelivery: string }
export interface Measure { id: string; item: string; w: number; h: number; qty: number }
export interface Order {
  id: string; projectId: string; title: string; kind: Kind; description: string; price: number; deposit: number
  stage: number
  estDelivery: string
  surveyDate: string; surveyorId: string | null
  measures: Measure[]
  transport: { status: 'planned' | 'transit' | 'arrived'; dest: 'workshop' | 'factory'; factory: string; driverId: string | null; vehicle: string }
  quality: { checks: boolean[]; status: 'pending' | 'approved' | 'rejected'; note: string }
  install: { date: string; teamId: string | null }
  delivery: { status: 'pending' | 'awaiting' | 'accepted' | 'issue' }
  rework: { reason: string; fromStage: number; at: string } | null
  createdAt: string
}
export interface Task {
  id: string; orderId: string; title: string; workerId: string | null; status: 'todo' | 'doing' | 'done'
  stage: 'manufacturing' | 'installation'; startedAt?: string; doneAt?: string; due: string; urgent?: boolean; hint?: string
}
export interface Photo { id: string; orderId: string; stage: StageKey; src: string; note: string; visible: boolean; by: string; at: string }
export interface Note { id: string; orderId: string; stage: StageKey; text: string; by: string; at: string }
export interface Problem { id: string; orderId: string; taskId?: string; kind: string; text: string; by: string; at: string; resolved: boolean }
export interface ReturnReq {
  id: string; orderId: string; reason: string; type: 'return' | 'rework'; status: 'open' | 'inprogress' | 'resolved'
  createdAt: string; source: 'admin' | 'customer' | 'quality'
}
export interface Message { id: string; projectId: string; from: 'customer' | 'workshop'; text: string; image?: string; at: string }
export interface Activity { id: string; text: string; at: string; orderId?: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }

export interface DB {
  employees: Employee[]; projects: Project[]; orders: Order[]; tasks: Task[]; photos: Photo[]; notes: Note[]
  problems: Problem[]; returns: ReturnReq[]; messages: Message[]; activity: Activity[]
}

export const QUALITY_CHECKS = ['الأبعاد مطابقة للقياسات', 'جودة اللحام ومتانته', 'الدهان والتشطيب', 'سلامة الحواف وعدم وجود نتوءات']
