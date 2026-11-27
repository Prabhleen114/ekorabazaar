import { z } from 'zod'

// --- Cart ---
export const AddToCartSchema = z.object({
  productId: z.union([z.string(), z.number()]).transform(val => String(val)),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(500, 'Maximum 500 units per item'),
})

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(500, 'Maximum 500 units per item'),
})

// --- Address ---
export const AddressSchema = z.object({
  name: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  line1: z.string().optional(),
  addressLine1: z.string().optional(),
  line2: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  isDefault: z.boolean().optional(),
  id: z.string().optional(),
}).transform(val => ({
  ...val,
  name: val.name || val.fullName || 'Customer',
  fullName: val.fullName || val.name || 'Customer',
  line1: val.line1 || val.addressLine1 || '',
  addressLine1: val.addressLine1 || val.line1 || '',
  line2: val.line2 || val.addressLine2 || '',
  addressLine2: val.addressLine2 || val.line2 || ''
}))

// --- Checkout ---
export const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.union([z.string(), z.number()]).transform(val => String(val)),
    quantity: z.number().int().min(1).max(500),
  })).min(1, 'At least one item required').max(50, 'Maximum 50 items per order'),
  addressId: z.string().optional().nullable(),
  guestAddress: AddressSchema.optional().nullable(),
  gstin: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
})

// --- Coupons ---
export const ValidateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50),
  subtotal: z.number().min(0, 'Subtotal must be positive').optional(),
  subtotalPaise: z.number().int().min(0).optional(),
})

export const CreateCouponSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(30, 'Code max 30 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(255).optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  minOrderAmount: z.number().min(0).default(0), // In Rupees
  maxDiscountAmount: z.number().min(0).optional().nullable(), // In Rupees (for percentage)
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  maxUsageLimit: z.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.number().int().min(1).default(1),
  status: z.enum(['ACTIVE', 'PAUSED']).default('ACTIVE'),
})

export const UpdateCouponSchema = z.object({
  description: z.string().max(255).optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional().nullable(),
  startDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  maxUsageLimit: z.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
})

export const ConfirmPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Missing Razorpay order ID'),
  razorpayPaymentId: z.string().min(1, 'Missing Razorpay payment ID'),
  razorpaySignature: z.string().min(1, 'Missing Razorpay signature'),
})

// --- Auth ---
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional().nullable(),
})


// --- Seller Products ---
export const SellerProductSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  category: z.string().min(1, 'Category is required'),
  price: z.number().int().min(1, 'Price must be at least 1 paise'),
  customerPrice: z.number().int().min(1).optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  wholesaleTiers: z.array(z.object({
    minQty: z.number().int().min(1),
    maxQty: z.number().int().nullable().optional(),
    price: z.number().int().min(1),
  })).optional().nullable(),
})

// --- Admin Order Shipments ---
export const SHIPMENT_STATUS_VALUES = [
  'CREATED',
  'AWB_ASSIGNED',
  'PICKUP_SCHEDULED',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'EXCEPTION',
] as const

export const OrderShipmentCreateSchema = z.object({
  courierName: z.string().trim().min(1, 'Courier partner name is required').max(100),
  awbCode: z.string().trim().min(1, 'AWB / tracking number is required').max(100),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((val) => !val || /^https?:\/\//i.test(val), 'Tracking URL must start with http:// or https://'),
  status: z.enum(SHIPMENT_STATUS_VALUES).default('SHIPPED'),
  updateOrderStatus: z.boolean().optional(),
})

export const OrderShipmentUpdateSchema = z.object({
  courierName: z.string().trim().min(1, 'Courier partner name is required').max(100).optional(),
  awbCode: z.string().trim().min(1, 'AWB / tracking number is required').max(100).optional(),
  trackingUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .refine((val) => !val || /^https?:\/\//i.test(val), 'Tracking URL must start with http:// or https://'),
  status: z.enum(SHIPMENT_STATUS_VALUES).optional(),
})

// --- Admin Private Order Notes ---
export const OrderAdminNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content is required').max(5000, 'Note cannot exceed 5000 characters'),
})

// --- Admin Leads ---
export const UpdateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CONVERTED', 'LOST']).optional(),
  reason: z.string().trim().max(1000).optional().nullable(),
})

// --- Admin Product Management ---
const isValidImageRef = (val: string) =>
  val.startsWith('/') || /^https?:\/\//i.test(val)

export const AdminProductUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Product name is required').max(300),
  description: z.string().max(10000).optional().nullable(),
  category: z.string().trim().min(1, 'Category is required').max(150),
  sellingPrice: z.number().finite().positive('Selling price must be greater than ₹0'),
  mrp: z.number().finite().positive('MRP must be greater than ₹0').optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED']).optional(),
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .refine((val) => !val || isValidImageRef(val), 'Invalid image URL'),
  images: z
    .array(
      z.string().trim().min(1).max(1000).refine(isValidImageRef, 'Invalid image URL in gallery')
    )
    .max(15)
    .optional(),
}).refine(
  (data) => data.mrp === undefined || data.mrp === null || data.mrp >= data.sellingPrice,
  { message: 'MRP must be greater than or equal to Selling Price', path: ['mrp'] }
)

// --- Generic Helper: safe parse and return error response ---
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.issues[0]
    const field = firstError?.path && firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : ''
    return { success: false, error: `${field}${firstError?.message || 'Validation error'}` }
  }
  return { success: true, data: result.data }
}
