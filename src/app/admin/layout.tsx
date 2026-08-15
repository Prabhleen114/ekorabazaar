import { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin().catch(() => null)
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Ekora Admin</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Dashboard
          </Link>
          <Link href="/admin/sellers" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Seller Management
          </Link>
          <Link href="/admin/products" className="block px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white">
            Product Approvals
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
      <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
        {children}
      </main>
    </div>
  )
}
