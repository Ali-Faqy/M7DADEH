import type { ReactNode } from 'react'

/** On desktop, shows the mobile apps inside a phone-sized frame. On a real phone it fills the screen. */
export function PhoneShell({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="h-full md:flex md:flex-col md:items-center md:justify-center bg-[#e9e5dc] md:p-4">
      <div className="hidden md:block text-sm font-bold text-mute mb-2">{caption}</div>
      <div className="relative h-full w-full md:h-[min(820px,100%)] md:max-w-[410px] md:rounded-[40px] md:border-[10px] md:border-ink md:shadow-2xl overflow-hidden bg-paper flex flex-col [transform:translateZ(0)]">
        {children}
      </div>
    </div>
  )
}
