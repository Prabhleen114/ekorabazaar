'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function fetchOverview() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.status === 401) {
          router.push('/login?redirect=/admin');
          return;
        }
        if (res.status === 403) {
          router.push('/');
          return;
        }
        if (!res.ok) {
          throw new Error('Failed to load overview data');
        }
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Error loading dashboard');
          setLoading(false);
        }
      }
    }
    fetchOverview();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-white p-6 rounded-xl border border-gray-100"></div>
          ))}
        </div>
        <div className="h-6 w-36 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white p-6 rounded-xl border border-gray-100"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  const {
    totalSalesINR = 0,
    totalOrders = 0,
    paidOrders = 0,
    pendingOrders = 0,
    failedOrders = 0,
    totalSellers = 0,
    pendingSellers = 0,
    activeSellers = 0,
    suspendedSellers = 0,
    totalProducts = 0,
    pendingProducts = 0,
  } = data || {};

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

      <h2 className="text-xl font-bold mb-4">Sellers &amp; Products</h2>
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
  );
}
