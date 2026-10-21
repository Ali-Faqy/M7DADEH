// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import App from '../src/App'
;(Element.prototype as any).scrollTo = () => {}

const go = (h: string) => { cleanup(); window.location.hash = h }
const routes = ['/admin','/admin/projects','/admin/projects/p1','/admin/orders','/admin/orders/ORD-001','/admin/orders/ORD-010','/admin/survey','/admin/measurements','/admin/manufacturing','/admin/transport','/admin/quality','/admin/installation','/admin/delivery','/admin/returns','/admin/employees','/admin/reports','/worker','/worker/task/t2','/customer','/customer/project/p1','/customer/project/p1/photos','/customer/project/p1/message','/customer/project/p2/delivery']

describe('routes render', () => {
  for (const r of routes) it(r, () => { go(r); const { container } = render(<App />); expect(container.textContent!.length).toBeGreaterThan(50) })
})

describe('flows', () => {
  it('worker flow', async () => {
    go('/worker'); render(<App />)
    fireEvent.click(screen.getByText('لحام بوابة حديد').closest('a')!)
    fireEvent.click(await screen.findByText('ابدأ العمل'))
    expect(await screen.findByText('جاري العمل')).toBeTruthy()
    fireEvent.click(screen.getByText('أنهيت العمل').closest('a')!)
    fireEvent.click(await screen.findByText('نعم، أنهيت العمل'))
    expect(await screen.findByText(/أحسنت/)).toBeTruthy()
  })
  it('customer accept', async () => {
    go('/customer/project/p2/delivery'); render(<App />)
    fireEvent.click(await screen.findByText('قبول التسليم'))
    fireEvent.click(await screen.findByText('نعم، استلمت'))
    expect(await screen.findByText(/تم الاستلام/)).toBeTruthy()
  })
  it('admin create project + order', async () => {
    go('/admin/projects'); render(<App />)
    fireEvent.click(screen.getAllByText('إنشاء مشروع')[0])
    fireEvent.click(await screen.findByText('تعبئة بيانات تجريبية'))
    fireEvent.click(screen.getByText('إنشاء المشروع'))
    expect(await screen.findByText('مشروع منزل أبو سليم')).toBeTruthy()
    fireEvent.click(screen.getByText('إضافة طلبية'))
    const dlg = await screen.findByText('إضافة طلبية للمشروع')
    fireEvent.change(within(dlg.closest('div')!.parentElement!).getByPlaceholderText('مثال: تصنيع وتركيب بوابة حديد'), { target: { value: 'بوابة تجريبية' } })
    fireEvent.click(screen.getByText('إضافة الطلبية'))
    expect(await screen.findByText(/بوابة تجريبية/)).toBeTruthy()
  })
  it('admin quality reject sends back', async () => {
    go('/admin/quality'); render(<App />)
    fireEvent.click(await screen.findByText('رفض وإعادة للتصنيع'))
    fireEvent.click(await screen.findByText('لحام غير متين'))
    fireEvent.click(screen.getByText('تأكيد الرفض'))
    expect((await screen.findAllByText(/لا توجد طلبيات في هذه المرحلة/)).length).toBeGreaterThan(0)
  })
})
