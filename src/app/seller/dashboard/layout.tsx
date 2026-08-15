import { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SellerDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth().catch(() => null)
  
  if (!session || session.role !== 'SELLER') {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Seller Portal</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/seller/dashboard" className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
            Overview
          </Link>
          <Link href="/seller/dashboard/profile" className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
            Business Profile
          </Link>
          <Link href="/seller/dashboard/products" className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
            Products
          </Link>
          <Link href="/seller/dashboard/orders" className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
            Orders
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
