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
