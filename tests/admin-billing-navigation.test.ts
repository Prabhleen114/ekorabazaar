import { describe, it, expect } from 'vitest'
import { BILLING_APP_URL } from '@/config/billing'
import fs from 'fs'
import path from 'path'

describe('Admin Billing Navigation Integration', () => {
  it('has centralized BILLING_APP_URL configured pointing to the deployed Vercel application', () => {
    expect(BILLING_APP_URL).toBe('https://autobilling-rho.vercel.app')
    expect(BILLING_APP_URL.startsWith('https://')).toBe(true)
  })

  it('admin layout includes Billing navigation item positioned near Orders with safe new-tab attributes', () => {
    const layoutPath = path.resolve(process.cwd(), 'src/app/admin/layout.tsx')
    const layoutSource = fs.readFileSync(layoutPath, 'utf8')

    // Must import BILLING_APP_URL and Lucide icon
    expect(layoutSource).toContain("from '@/config/billing'")
    expect(layoutSource).toContain('Receipt')
    expect(layoutSource).toContain('ExternalLink')

    // Must have safe external link attributes
    expect(layoutSource).toContain('target="_blank"')
    expect(layoutSource).toContain('rel="noopener noreferrer"')
    expect(layoutSource).toContain('Billing')

    // Verify ordering: Orders must appear before Billing, and Leads after Billing
    const ordersIndex = layoutSource.indexOf('/admin/orders')
    const billingIndex = layoutSource.indexOf('Billing')
    const leadsIndex = layoutSource.indexOf('/admin/leads')

    expect(ordersIndex).toBeGreaterThan(-1)
    expect(billingIndex).toBeGreaterThan(-1)
    expect(leadsIndex).toBeGreaterThan(-1)
    expect(ordersIndex).toBeLessThan(billingIndex)
    expect(billingIndex).toBeLessThan(leadsIndex)
  })
})
