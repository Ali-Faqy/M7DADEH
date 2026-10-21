import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react'

/* ---------- Button ---------- */
type Variant = 'primary' | 'secondary' | 'danger' | 'warn' | 'ghost' | 'soft'
type Size = 'sm' | 'md' | 'lg' | 'xl'
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  secondary: 'bg-white text-ink border border-line hover:bg-card',
  danger: 'bg-bad text-white hover:bg-[#a52f23] shadow-sm',
  warn: 'bg-warn text-white hover:bg-[#c2711f] shadow-sm',
  ghost: 'text-ink hover:bg-card',
  soft: 'bg-brand-soft text-brand-dark hover:bg-[#d4e1d8]',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg', md: 'h-11 px-4 text-base rounded-xl', lg: 'h-14 px-5 text-lg rounded-xl', xl: 'h-20 px-6 text-2xl rounded-2xl',
}
export function Btn({ variant = 'primary', size = 'md', icon, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-2 font-bold transition active:scale-[.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${sizes[size]} ${variants[variant]} ${className}`}>
      {icon}{children}
    </button>
  )
}

/* ---------- Card / Badge / misc ---------- */
export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`bg-white border border-line rounded-2xl ${className}`}>{children}</div>

const tones = {
  ok: 'bg-brand-soft text-brand-dark', warn: 'bg-warn-soft text-[#a85f14]', bad: 'bg-bad-soft text-bad',
  info: 'bg-info-soft text-info', neutral: 'bg-card text-mute',
}
export type Tone = keyof typeof tones
export const Badge = ({ tone = 'neutral', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) =>
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`}>{children}</span>

export function ProgressBar({ value, tone = 'ok', h = 'h-2.5' }: { value: number; tone?: 'ok' | 'warn' | 'bad'; h?: string }) {
  const c = tone === 'ok' ? 'bg-brand' : tone === 'warn' ? 'bg-warn' : 'bg-bad'
  return <div className={`w-full ${h} bg-card rounded-full overflow-hidden`}><div className={`${c} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.round(value * 100)}%` }} /></div>
}

export const Avatar = ({ name, color = '#4a6b57', size = 40 }: { name: string; color?: string; size?: number }) =>
  <div className="rounded-full grid place-items-center text-white font-bold shrink-0" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>{name.trim().charAt(0)}</div>

export const inputCls = 'w-full h-11 px-3 rounded-xl border border-line bg-white text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20'
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block"><span className="block text-sm font-bold text-ink mb-1.5">{label}</span>{children}{hint && <span className="block text-xs text-mute mt-1">{hint}</span>}</label>
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return <div className="text-center py-10 px-4 text-mute"><div className="mx-auto w-14 h-14 rounded-full bg-card grid place-items-center mb-3">{icon}</div><div className="font-bold text-ink">{title}</div>{text && <div className="text-sm mt-1">{text}</div>}</div>
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div><h1 className="text-2xl md:text-3xl font-extrabold">{title}</h1>{sub && <p className="text-mute mt-1">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/45 p-0 sm:p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`fade-up bg-paper w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92%] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-xl font-extrabold">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="w-10 h-10 grid place-items-center rounded-full hover:bg-card"><X size={22} /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-line flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'warn' | 'bad' | 'info') => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; tone: 'ok' | 'warn' | 'bad' | 'info' }[]>([])
  const idRef = useRef(0)
  const push = useCallback((msg: string, tone: 'ok' | 'warn' | 'bad' | 'info' = 'ok') => {
    const id = ++idRef.current
    setItems(p => [...p, { id, msg, tone }])
    setTimeout(() => setItems(p => p.filter(x => x.id !== id)), 2800)
  }, [])
  const bg = { ok: 'bg-brand', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-info' }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-14 inset-x-0 z-[70] flex flex-col items-center gap-2 pointer-events-none px-3">
        {items.map(t => (
          <div key={t.id} className={`fade-up ${bg[t.tone]} text-white rounded-2xl px-5 py-3 shadow-lg flex items-center gap-2 font-bold max-w-md`}>
            {t.tone === 'ok' ? <CheckCircle2 size={20} /> : t.tone === 'info' ? <Info size={20} /> : <AlertTriangle size={20} />}{t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- Scroll container (resets scroll on navigation) ---------- */
export function ScrollArea({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useEffect(() => { ref.current?.scrollTo({ top: 0 }) }, [pathname])
  return <div ref={ref} className={`overflow-y-auto ${className}`}>{children}</div>
}

/* ---------- File → data URL ---------- */
export function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file) })
}
