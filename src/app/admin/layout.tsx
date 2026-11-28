import { ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Receipt, ExternalLink, Menu, X } from 'lucide-react'
import { BILLING_APP_URL } from '@/config/billing'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-gray-100">
      <input id="admin-nav-toggle" type="checkbox" className="peer hidden" />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 sticky top-0 z-30">
        <span className="text-lg font-bold text-white">Ekora Admin</span>
        <label
          htmlFor="admin-nav-toggle"
          className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
          aria-label="Toggle admin navigation"
        >
          <Menu className="w-5 h-5" />
        </label>
      </header>

      {/* Mobile Backdrop */}
      <label
        htmlFor="admin-nav-toggle"
        className="hidden peer-checked:block md:hidden fixed inset-0 bg-black/50 z-30"
      />

      {/* Sidebar */}
      <aside className="fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-800 border-r border-gray-700 flex flex-col transform -translate-x-full peer-checked:translate-x-0 md:translate-x-0 transition-transform duration-200 md:min-h-screen shrink-0">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Ekora Admin</h2>
          <label
            htmlFor="admin-nav-toggle"
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </label>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <Link href="/admin" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/orders" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Orders
          </Link>
          <Link href="/admin/coupons" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Coupons
          </Link>
          <a
            href={BILLING_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span>Billing</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
          </a>
          <Link href="/admin/leads" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Leads
          </Link>
          <Link href="/admin/sellers" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Seller Management
          </Link>
          <Link href="/admin/product-management" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Product Management
          </Link>
          <Link href="/admin/products" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Product Approvals
          </Link>
          <Link href="/admin/reviews" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Reviews
          </Link>
          <Link href="/admin/intelligence" className="px-4 py-2 text-sm font-medium text-amber-300 bg-gray-700/50 rounded-lg hover:bg-gray-700 hover:text-white flex items-center justify-between">
            <span>Customer Intelligence</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">B2B</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900 min-w-0">
        {children}
      </main>
    </div>
  )
}
