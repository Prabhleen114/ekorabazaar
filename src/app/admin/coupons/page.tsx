'use client';

import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  Clock,
  Users,
  Percent,
  IndianRupee,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

interface CouponItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  discountDisplay: string;
  minOrderAmountRupees: number;
  maxDiscountAmountRupees: number | null;
  startDate: string;
  expiryDate: string | null;
  maxUsageLimit: number | null;
  perCustomerLimit: number;
  usageCount: number;
  dbStatus: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED' | 'ARCHIVED' | 'SCHEDULED';
  ordersCount: number;
  usagesCount: number;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 'ALL' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED' | 'ARCHIVED';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    ALL: 0,
    ACTIVE: 0,
    PAUSED: 0,
    EXPIRED: 0,
    EXHAUSTED: 0,
    ARCHIVED: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    expiryDate: '',
    maxUsageLimit: '',
    perCustomerLimit: '1',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchCoupons();
  }, [activeTab]);

  const fetchCoupons = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = new URL('/api/admin/coupons', window.location.origin);
      if (activeTab !== 'ALL') url.searchParams.set('status', activeTab);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setErrorMsg('Unauthorized or session expired. Please log in as admin.');
          return;
        }
        throw new Error('Failed to load coupons');
      }

      const data = await res.json();
      setCoupons(data.coupons || []);
      if (data.counts) setCounts(data.counts);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCoupons();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: CouponItem) => {
    const nextStatus = coupon.dbStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update status');
      }
      setSuccessMsg(`Coupon ${coupon.code} is now ${nextStatus.toLowerCase()}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const openCreateModal = () => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 16);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      startDate: todayStr,
      expiryDate: '',
      maxUsageLimit: '',
      perCustomerLimit: '1',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (c: CouponItem) => {
    setSelectedCoupon(c);
    setFormData({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue:
        c.discountType === 'PERCENTAGE'
          ? String(c.discountValue)
          : String(c.discountValue / 100),
      minOrderAmount: String(c.minOrderAmountRupees),
      maxDiscountAmount: c.maxDiscountAmountRupees ? String(c.maxDiscountAmountRupees) : '',
      startDate: c.startDate ? c.startDate.slice(0, 16) : '',
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 16) : '',
      maxUsageLimit: c.maxUsageLimit ? String(c.maxUsageLimit) : '',
      perCustomerLimit: String(c.perCustomerLimit || 1),
      status: c.dbStatus === 'ARCHIVED' ? 'PAUSED' : c.dbStatus
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (c: CouponItem) => {
    setSelectedCoupon(c);
    setShowDeleteModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid positive discount value.');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || undefined,
        discountType: formData.discountType,
        discountValue: val,
        minOrderAmount: parseFloat(formData.minOrderAmount || '0') || 0,
        maxDiscountAmount:
          formData.discountType === 'PERCENTAGE' && formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        maxUsageLimit: formData.maxUsageLimit ? parseInt(formData.maxUsageLimit, 10) : null,
        perCustomerLimit: parseInt(formData.perCustomerLimit || '1', 10),
        status: formData.status
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create coupon');
      }

      setShowCreateModal(false);
      setSuccessMsg(`Coupon "${resData.coupon.code}" created successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoupon) return;
    setFormError('');

    const val = parseFloat(formData.discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Please enter a valid positive discount value.');
      return;
    }
    if (formData.discountType === 'PERCENTAGE' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        description: formData.description.trim() || null,
        discountType: formData.discountType,
        discountValue: val,
        minOrderAmount: parseFloat(formData.minOrderAmount || '0') || 0,
        maxDiscountAmount:
          formData.discountType === 'PERCENTAGE' && formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        maxUsageLimit: formData.maxUsageLimit ? parseInt(formData.maxUsageLimit, 10) : null,
        perCustomerLimit: parseInt(formData.perCustomerLimit || '1', 10),
        status: formData.status
      };

      const res = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update coupon');
      }

      setShowEditModal(false);
      setSuccessMsg(`Coupon "${selectedCoupon.code}" updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCoupon) return;
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${selectedCoupon.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete coupon');
      }

      setShowDeleteModal(false);
      setSuccessMsg(data.message || 'Coupon removed.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const getStatusBadge = (status: CouponItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        );
      case 'EXHAUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Users className="w-3 h-3" />
            Exhausted
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Calendar className="w-3 h-3" />
            Scheduled
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-brand-orange rounded-xl">
              <Tag className="w-6 h-6" />
            </div>
            Coupons & Discounts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount vouchers, set order thresholds, redemption caps, and track redemptions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-brand-orange hover:bg-brand-terracotta text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* ALERTS */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TABS & SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { key: 'ALL', label: 'All Coupons' },
                { key: 'ACTIVE', label: 'Active' },
                { key: 'PAUSED', label: 'Paused' },
                { key: 'EXPIRED', label: 'Expired' },
                { key: 'EXHAUSTED', label: 'Exhausted' },
                { key: 'ARCHIVED', label: 'Archived' }
              ] as { key: TabKey; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    activeTab === tab.key
                      ? 'bg-gray-700 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search coupon code or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-64 focus:bg-white focus:outline-none focus:border-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              title="Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchCoupons();
              }}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* COUPONS TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-orange" />
            <p className="text-sm">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-16 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No coupons found</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              {searchQuery
                ? `No results match "${searchQuery}". Try a different keyword.`
                : 'Get started by creating your first promotional coupon discount.'}
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-brand-orange text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-brand-terracotta"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4">Redemptions</th>
                  <th className="py-3.5 px-4">Customer Limit</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                    {/* Code & Note */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {c.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(c.code)}
                          title="Copy Code"
                          className="text-gray-400 hover:text-gray-700"
                        >
                          {copiedCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 max-w-xs">
                          {c.description}
                        </p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-sm">
                        {c.discountDisplay}
                      </div>
                      {c.discountType === 'PERCENTAGE' && c.maxDiscountAmountRupees && (
                        <div className="text-[11px] text-gray-500">
                          Capped at ₹{c.maxDiscountAmountRupees.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    {/* Min Order */}
                    <td className="py-3.5 px-4 font-medium text-gray-700">
                      {c.minOrderAmountRupees > 0
                        ? `₹${c.minOrderAmountRupees.toLocaleString('en-IN')}`
                        : 'No min.'}
                    </td>

                    {/* Redemptions */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">
                        {c.usageCount}{' '}
                        <span className="text-gray-400 font-normal">
                          / {c.maxUsageLimit ? c.maxUsageLimit : '∞'}
                        </span>
                      </div>
                      {c.maxUsageLimit && (
                        <div className="w-20 bg-gray-200 rounded-full h-1 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.usageCount >= c.maxUsageLimit
                                ? 'bg-purple-600'
                                : 'bg-brand-orange'
                            }`}
                            style={{
                              width: `${Math.min(100, (c.usageCount / c.maxUsageLimit) * 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Per-customer Limit */}
                    <td className="py-3.5 px-4 text-gray-600">
                      {c.perCustomerLimit} per customer
                    </td>

                    {/* Validity */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="text-[11px]">
                        <span className="text-gray-400">From: </span>
                        {new Date(c.startDate).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-[11px]">
                        <span className="text-gray-400">To: </span>
                        {c.expiryDate ? (
                          new Date(c.expiryDate).toLocaleDateString('en-IN')
                        ) : (
                          <span className="text-emerald-700 font-medium">Never expires</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleToggleStatus(c)}
                            title={c.dbStatus === 'ACTIVE' ? 'Pause coupon' : 'Activate coupon'}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              c.dbStatus === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50 border-amber-200'
                                : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            {c.dbStatus === 'ACTIVE' ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          title="Edit details"
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          title="Delete / Archive"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-orange" />
                Create New Coupon
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Code */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EKORA10"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  className="w-full uppercase font-mono font-bold tracking-wider border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Description / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10% off for wholesale buyers"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as any
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none bg-white font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                    placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 100'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for none"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={formData.discountType !== 'PERCENTAGE'}
                    placeholder={
                      formData.discountType === 'PERCENTAGE' ? 'Optional cap' : 'N/A for fixed'
                    }
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscountAmount: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Expiry Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxUsageLimit}
                    onChange={(e) => setFormData({ ...formData, maxUsageLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Per-Customer Limit *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Default: 1"
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Status</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                      className="text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="font-medium text-emerald-700">Active immediately</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="PAUSED"
                      checked={formData.status === 'PAUSED'}
                      onChange={() => setFormData({ ...formData, status: 'PAUSED' })}
                      className="text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="font-medium text-amber-700">Paused (Draft)</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-orange hover:bg-brand-terracotta text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COUPON MODAL */}
      {showEditModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-orange" />
                Edit Coupon: <span className="font-mono text-brand-orange">{selectedCoupon.code}</span>
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as any
                      })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none bg-white font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Discount Percentage (%) *'
                      : 'Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={formData.discountType !== 'PERCENTAGE'}
                    placeholder={
                      formData.discountType === 'PERCENTAGE' ? 'Optional cap' : 'N/A for fixed'
                    }
                    value={formData.maxDiscountAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscountAmount: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Expiry Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              {/* Usage limits */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxUsageLimit}
                    onChange={(e) => setFormData({ ...formData, maxUsageLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Per-Customer Limit *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-2.5 focus:border-brand-orange focus:outline-none"
                  />
                </div>
              </div>

              {/* Operational Status */}
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Operational Status</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="ACTIVE"
                      checked={formData.status === 'ACTIVE'}
                      onChange={() => setFormData({ ...formData, status: 'ACTIVE' })}
                      className="text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="font-medium text-emerald-700">Active</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      value="PAUSED"
                      checked={formData.status === 'PAUSED'}
                      onChange={() => setFormData({ ...formData, status: 'PAUSED' })}
                      className="text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="font-medium text-amber-700">Paused</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-brand-orange hover:bg-brand-terracotta text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE / ARCHIVE MODAL */}
      {showDeleteModal && selectedCoupon && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedCoupon.ordersCount > 0 || selectedCoupon.usagesCount > 0
                  ? 'Archive Coupon'
                  : 'Delete Coupon'}
              </h2>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to remove coupon{' '}
              <strong className="font-mono text-gray-900">{selectedCoupon.code}</strong>?
            </p>

            {selectedCoupon.ordersCount > 0 || selectedCoupon.usagesCount > 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This coupon has been used in <strong>{selectedCoupon.ordersCount}</strong> order(s).
                  To preserve audit and financial records, it will be safely <strong>archived</strong> rather
                  than deleted from the database. Customers will no longer be able to use it.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs">
                This coupon has not been used in any orders and will be permanently removed.
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm {selectedCoupon.ordersCount > 0 ? 'Archive' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
