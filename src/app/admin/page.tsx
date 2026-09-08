import { requireAdmin } from '@/lib/auth'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'
import { OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const session = await requireAdmin().catch(() => null)
  if (!session) redirect('/')

  const [
    totalSellers,
    pendingSellers,
    activeSellers,
    suspendedSellers,
    totalProducts,
    pendingProducts,
    totalOrders,
    paidOrders,
    pendingOrders,
    failedOrders,
    salesData
  ] = await Promise.all([
    prisma.seller.count(),
    prisma.seller.count({ where: { applicationStatus: 'UNDER_REVIEW' } }),
    prisma.seller.count({ where: { accountStatus: 'ACTIVE' } }),
    prisma.seller.count({ where: { accountStatus: 'SUSPENDED' } }),
    prisma.product.count({ where: { status: 'PUBLISHED' } }),
    prisma.product.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PAID } }),
    prisma.order.count({ where: { status: OrderStatus.PAYMENT_PENDING } }),
    prisma.order.count({ where: { status: { in: [OrderStatus.CANCELLED] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: OrderStatus.PAID }
    })
  ])

  const totalSalesINR = (salesData._sum.total || 0) / 100

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sales</h3>
          <p className="text-2xl font-bold text-green-600">₹{totalSalesINR.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Orders</h3>
          <p className="text-2xl font-bold text-indigo-600">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Paid Orders</h3>
          <p className="text-2xl font-bold text-green-600">{paidOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Orders</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Failed/Cancelled</h3>
          <p className="text-2xl font-bold text-red-600">{failedOrders}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Sellers & Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Sellers</h3>
          <p className="text-2xl font-bold text-gray-900">{totalSellers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Sellers</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingSellers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active Sellers</h3>
          <p className="text-2xl font-bold text-green-600">{activeSellers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Suspended Sellers</h3>
          <p className="text-2xl font-bold text-red-600">{suspendedSellers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Published Products</h3>
          <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Products</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingProducts}</p>
        </div>
      </div>
    </div>
  )
}
