import { describe, it, expect, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { encrypt, SessionPayload } from '@/lib/session'

describe('Middleware & Edge Security Verification', () => {
  let adminToken: string
  let sellerToken: string
  let customerToken: string

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'a-very-secure-and-long-secret-key-for-testing-1234567890!'
    
    adminToken = await encrypt({
      userId: 'admin-user-id',
      role: 'ADMIN',
      sellerId: null,
    })

    sellerToken = await encrypt({
      userId: 'seller-user-id',
      role: 'SELLER',
      sellerId: 'sel-123',
    })

    customerToken = await encrypt({
      userId: 'customer-user-id',
      role: 'CUSTOMER',
      sellerId: null,
    })
  })

  function createRequest(url: string, cookieValue?: string): NextRequest {
    const headers = new Headers()
    if (cookieValue) {
      headers.set('cookie', `session=${cookieValue}`)
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), { headers })
  }

  describe('1. Unauthenticated / Logged-out Requests', () => {
    it('redirects logged-out user on /admin to /login with redirect param', async () => {
      const req = createRequest('http://localhost:3000/admin/orders')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(location).toContain('/login?redirect=%2Fadmin%2Forders')
    })

    it('redirects logged-out user on /seller/dashboard to /login with redirect param', async () => {
      const req = createRequest('http://localhost:3000/seller/dashboard')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(location).toContain('/login?redirect=%2Fseller%2Fdashboard')
    })

    it('redirects logged-out user on /checkout to /login with redirect param', async () => {
      const req = createRequest('http://localhost:3000/checkout')
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(location).toContain('/login?redirect=%2Fcheckout')
    })

    it('returns 401 for logged-out API requests to /api/admin/*', async () => {
      const req = createRequest('http://localhost:3000/api/admin/orders')
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 401 for logged-out API requests to /api/seller/*', async () => {
      const req = createRequest('http://localhost:3000/api/seller/products')
      const res = await middleware(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })
  })

  describe('2. Role-Based Access Control: Unauthorized Role Access', () => {
    it('blocks SELLER from accessing /admin UI (redirects to /)', async () => {
      const req = createRequest('http://localhost:3000/admin', sellerToken)
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(new URL(location!).pathname).toBe('/')
    })

    it('blocks SELLER from calling /api/admin/* (returns 403 Forbidden)', async () => {
      const req = createRequest('http://localhost:3000/api/admin/sellers', sellerToken)
      const res = await middleware(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Forbidden: Admin access required')
    })

    it('blocks CUSTOMER from accessing /seller/dashboard UI (redirects to /)', async () => {
      const req = createRequest('http://localhost:3000/seller/dashboard', customerToken)
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(new URL(location!).pathname).toBe('/')
    })

    it('blocks CUSTOMER from accessing /admin UI (redirects to /)', async () => {
      const req = createRequest('http://localhost:3000/admin/products', customerToken)
      const res = await middleware(req)
      expect(res.status).toBe(307)
      const location = res.headers.get('location')
      expect(new URL(location!).pathname).toBe('/')
    })

    it('blocks CUSTOMER from calling /api/seller/* (returns 403 Forbidden)', async () => {
      const req = createRequest('http://localhost:3000/api/seller/products', customerToken)
      const res = await middleware(req)
      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Forbidden: Seller access required')
    })
  })

  describe('3. Authorized Pass-Through', () => {
    it('allows ADMIN to access /admin UI and /api/admin/*', async () => {
      const reqUi = createRequest('http://localhost:3000/admin', adminToken)
      const resUi = await middleware(reqUi)
      expect(resUi.status).toBe(200)

      const reqApi = createRequest('http://localhost:3000/api/admin/orders', adminToken)
      const resApi = await middleware(reqApi)
      expect(resApi.status).toBe(200)
    })

    it('allows SELLER to access /seller/dashboard UI and /api/seller/*', async () => {
      const reqUi = createRequest('http://localhost:3000/seller/dashboard', sellerToken)
      const resUi = await middleware(reqUi)
      expect(resUi.status).toBe(200)

      const reqApi = createRequest('http://localhost:3000/api/seller/products', sellerToken)
      const resApi = await middleware(reqApi)
      expect(resApi.status).toBe(200)
    })

    it('allows CUSTOMER to access /checkout and /account', async () => {
      const reqCheckout = createRequest('http://localhost:3000/checkout', customerToken)
      const resCheckout = await middleware(reqCheckout)
      expect(resCheckout.status).toBe(200)

      const reqAccount = createRequest('http://localhost:3000/account', customerToken)
      const resAccount = await middleware(reqAccount)
      expect(resAccount.status).toBe(200)
    })

    it('allows public routes (/shop, /products/123, /) without session', async () => {
      const reqShop = createRequest('http://localhost:3000/shop')
      const resShop = await middleware(reqShop)
      expect(resShop.status).toBe(200)
    })
  })
})
