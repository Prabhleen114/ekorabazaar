export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type PrismaUser = {
  id: string;
  name?: string | null;
  email: string;
  role: Role | string;
  createdAt: Date;
  addresses: PrismaAddress[];
  orders: PrismaOrder[];
  events: PrismaEvent[];
};

export type PrismaAddress = {
  id: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  isDefault?: boolean;
  createdAt: Date;
};

export type PrismaOrder = {
  id: string;
  customerId: string;
  total: number;
  status: OrderStatus;
  dispatchedAt?: Date | null;
  createdAt: Date;
  customer?: PrismaUser;
};

export type PrismaEvent = {
  id: string;
  sessionId?: string | null;
  userId?: string | null;
  eventName: string;
  productId?: string | null;
  metadata?: any;
  createdAt: Date;
  user?: PrismaUser;
};

export type PrismaCustomerFlag = {
  id?: string;
  userId: string;
  flag: string;
  evidence: string[] | any;
  resolved: boolean;
  firstDetectedAt: Date;
  lastUpdatedAt: Date;
  user?: PrismaUser;
};
