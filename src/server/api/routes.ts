import { RouteDefinition } from './types';
import {
  handleMe,
  handleLogin,
  handleSignup,
  handleLogout,
  handleGoogle,
  handleGoogleCallback,
} from './handlers/auth';
import {
  handleGetCart,
  handlePostCart,
  handleDeleteCart,
  handleGuestCart,
  handleSyncCart,
  handlePatchCartItem,
  handleDeleteCartItem,
} from './handlers/cart';
import {
  handleQuote,
  handleRecommendations,
  handleCreateOrder,
  handleConfirmPayment,
  handleCheckoutCallback,
} from './handlers/checkout';
import {
  handleGetAccountOrders,
  handleGetAddresses,
  handlePostAddress,
  handlePatchAddress,
  handleDeleteAddress,
} from './handlers/account';
import {
  handleGetAdminCoupons,
  handlePostAdminCoupons,
  handleGetAdminCouponById,
  handlePatchAdminCouponById,
  handleDeleteAdminCouponById,
  handleGetAdminLeads,
  handleGetAdminOrders,
  handlePostAdminOrdersRestoreExpired,
  handleGetAdminOrderById,
  handlePatchAdminOrderById,
  handlePostAdminOrderShip,
  handlePostAdminPriceRequest,
  handlePostAdminProductApprove,
  handlePostAdminProductReject,
  handlePostAdminSellerApprove,
  handlePostAdminSellerReactivate,
  handlePostAdminSellerReject,
  handlePostAdminSellerSuspend,
} from './handlers/admin';
import {
  handleSellerPaymentCreateOrder,
  handleSellerPaymentConfirmPayment,
  handlePostSellerProduct,
  handlePatchSellerProductById,
  handlePostSellerProductSubmit,
  handlePostSellerUploadImage,
  handlePostSellerApplication,
  handleGetSellerApplication,
} from './handlers/seller';
import {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
  handleCronRestoreExpired,
  handleCronIntelligence,
} from './handlers/webhooks-cron';
import {
  handleCollect,
  handleEvents,
  handleTrending,
  handleSearchSuggestions,
  handleDocs,
  handleApply,
  handleProducts,
  handleCouponsValidate,
  handleTrackHesitation,
  handleAdminIntelligence,
  handleAdminIntelligenceAnalytics,
  handleAdminIntelligenceCustomers,
  handleAdminIntelligenceResolve,
  handleAdminIntelligenceRunJobs,
  handleAdminIntelligenceE2EGet,
  handleAdminIntelligenceE2EPost,
} from './handlers/misc';

export const allRoutes: RouteDefinition[] = [
  // Auth
  { method: 'GET', pattern: '/auth/me', handler: handleMe },
  { method: 'POST', pattern: '/auth/login', handler: handleLogin },
  { method: 'POST', pattern: '/auth/signup', handler: handleSignup },
  { method: 'POST', pattern: '/auth/logout', handler: handleLogout },
  { method: 'GET', pattern: '/auth/google', handler: handleGoogle },
  { method: 'GET', pattern: '/auth/google/callback', handler: handleGoogleCallback },

  // Cart
  { method: 'GET', pattern: '/cart', handler: handleGetCart },
  { method: 'POST', pattern: '/cart', handler: handlePostCart },
  { method: 'DELETE', pattern: '/cart', handler: handleDeleteCart },
  { method: 'POST', pattern: '/cart/guest', handler: handleGuestCart },
  { method: 'POST', pattern: '/cart/sync', handler: handleSyncCart },
  { method: 'PATCH', pattern: '/cart/:itemId', handler: handlePatchCartItem },
  { method: 'DELETE', pattern: '/cart/:itemId', handler: handleDeleteCartItem },

  // Checkout
  { method: 'POST', pattern: '/checkout/quote', handler: handleQuote },
  { method: 'GET', pattern: '/checkout/recommendations', handler: handleRecommendations },
  { method: 'POST', pattern: '/checkout/recommendations', handler: handleRecommendations },
  { method: 'POST', pattern: '/checkout/create-order', handler: handleCreateOrder },
  { method: 'POST', pattern: '/checkout/confirm-payment', handler: handleConfirmPayment },
  { method: 'POST', pattern: '/checkout/callback', handler: handleCheckoutCallback },

  // Account & Addresses
  { method: 'GET', pattern: '/account/orders', handler: handleGetAccountOrders },
  { method: 'GET', pattern: '/addresses', handler: handleGetAddresses },
  { method: 'POST', pattern: '/addresses', handler: handlePostAddress },
  { method: 'PATCH', pattern: '/addresses/:id', handler: handlePatchAddress },
  { method: 'DELETE', pattern: '/addresses/:id', handler: handleDeleteAddress },

  // Admin
  { method: 'GET', pattern: '/admin/coupons', handler: handleGetAdminCoupons },
  { method: 'POST', pattern: '/admin/coupons', handler: handlePostAdminCoupons },
  { method: 'GET', pattern: '/admin/coupons/:id', handler: handleGetAdminCouponById },
  { method: 'PATCH', pattern: '/admin/coupons/:id', handler: handlePatchAdminCouponById },
  { method: 'DELETE', pattern: '/admin/coupons/:id', handler: handleDeleteAdminCouponById },
  { method: 'GET', pattern: '/admin/leads', handler: handleGetAdminLeads },
  { method: 'GET', pattern: '/admin/orders', handler: handleGetAdminOrders },
  { method: 'GET', pattern: '/admin/orders/restore-expired', handler: handlePostAdminOrdersRestoreExpired },
  { method: 'POST', pattern: '/admin/orders/restore-expired', handler: handlePostAdminOrdersRestoreExpired },
  { method: 'GET', pattern: '/admin/orders/:id', handler: handleGetAdminOrderById },
  { method: 'PATCH', pattern: '/admin/orders/:id', handler: handlePatchAdminOrderById },
  { method: 'POST', pattern: '/admin/orders/:id/ship', handler: handlePostAdminOrderShip },
  { method: 'POST', pattern: '/admin/price-requests/:id', handler: handlePostAdminPriceRequest },
  { method: 'POST', pattern: '/admin/products/:productId/approve', handler: handlePostAdminProductApprove },
  { method: 'POST', pattern: '/admin/products/:productId/reject', handler: handlePostAdminProductReject },
  { method: 'POST', pattern: '/admin/sellers/:sellerId/approve', handler: handlePostAdminSellerApprove },
  { method: 'POST', pattern: '/admin/sellers/:sellerId/reactivate', handler: handlePostAdminSellerReactivate },
  { method: 'POST', pattern: '/admin/sellers/:sellerId/reject', handler: handlePostAdminSellerReject },
  { method: 'POST', pattern: '/admin/sellers/:sellerId/suspend', handler: handlePostAdminSellerSuspend },

  // Seller
  { method: 'POST', pattern: '/seller/payment/create-order', handler: handleSellerPaymentCreateOrder },
  { method: 'POST', pattern: '/seller/payment/confirm-payment', handler: handleSellerPaymentConfirmPayment },
  { method: 'POST', pattern: '/seller/products', handler: handlePostSellerProduct },
  { method: 'PATCH', pattern: '/seller/products/:productId', handler: handlePatchSellerProductById },
  { method: 'POST', pattern: '/seller/products/:productId/submit', handler: handlePostSellerProductSubmit },
  { method: 'POST', pattern: '/seller/upload-image', handler: handlePostSellerUploadImage },
  { method: 'GET', pattern: '/seller-application', handler: handleGetSellerApplication },
  { method: 'POST', pattern: '/seller-application', handler: handlePostSellerApplication },

  // Webhooks & Cron
  { method: 'POST', pattern: '/webhooks/razorpay', handler: handleRazorpayWebhook },
  { method: 'POST', pattern: '/webhooks/shiprocket', handler: handleShiprocketWebhook },
  { method: 'GET', pattern: '/cron/restore-expired', handler: handleCronRestoreExpired },
  { method: 'GET', pattern: '/cron/intelligence', handler: handleCronIntelligence },

  // Misc
  { method: 'POST', pattern: '/collect', handler: handleCollect },
  { method: 'POST', pattern: '/events', handler: handleEvents },
  { method: 'GET', pattern: '/trending', handler: handleTrending },
  { method: 'GET', pattern: '/search/suggestions', handler: handleSearchSuggestions },
  { method: 'GET', pattern: '/docs/:slug/:type', handler: handleDocs },
  { method: 'POST', pattern: '/apply', handler: handleApply },
  { method: 'GET', pattern: '/products', handler: handleProducts },
  { method: 'POST', pattern: '/coupons/validate', handler: handleCouponsValidate },
  { method: 'POST', pattern: '/track-hesitation', handler: handleTrackHesitation },
  { method: 'POST', pattern: '/intelligence/track-hesitation', handler: handleTrackHesitation },
  { method: 'GET', pattern: '/admin/intelligence', handler: handleAdminIntelligence },
  { method: 'GET', pattern: '/admin/intelligence/analytics', handler: handleAdminIntelligenceAnalytics },
  { method: 'GET', pattern: '/admin/intelligence/customers', handler: handleAdminIntelligenceCustomers },
  { method: 'POST', pattern: '/admin/intelligence/resolve', handler: handleAdminIntelligenceResolve },
  { method: 'POST', pattern: '/admin/intelligence/run-jobs', handler: handleAdminIntelligenceRunJobs },
  { method: 'GET', pattern: '/admin/intelligence-e2e', handler: handleAdminIntelligenceE2EGet },
  { method: 'POST', pattern: '/admin/intelligence-e2e', handler: handleAdminIntelligenceE2EPost },
];
