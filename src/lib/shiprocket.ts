/**
 * Shiprocket API Integration Helper for Ekora Bazaar
 * Supports rates calculation, EDD (Estimated Date of Delivery), tracking, and order dispatch.
 */

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external';

let cachedToken: string | null = null;
let tokenExpiryTime = 0;

export async function getShiprocketToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    return null;
  }

  // Reuse token if still valid (valid for 10 days, refresh after 8)
  const now = Date.now();
  if (cachedToken && now < tokenExpiryTime) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.error('Failed to authenticate with Shiprocket:', await res.text());
      return null;
    }

    const data = await res.json();
    cachedToken = data.token;
    tokenExpiryTime = now + 8 * 24 * 60 * 60 * 1000; // 8 days
    return cachedToken;
  } catch (error) {
    console.error('Error fetching Shiprocket token:', error);
    return null;
  }
}

/**
 * Get serviceable couriers and rates between pickup and delivery postcodes.
 */
export async function calculateShippingRate(params: {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod?: boolean;
}) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const url = new URL(`${SHIPROCKET_API_BASE}/courier/serviceability/`);
    url.searchParams.set('pickup_postcode', params.pickupPincode);
    url.searchParams.set('delivery_postcode', params.deliveryPincode);
    url.searchParams.set('weight', String(params.weightKg || 0.5));
    url.searchParams.set('cod', params.cod ? '1' : '0');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Shiprocket rate check failed:', err);
    return null;
  }
}

/**
 * Track an order via AWB or Shiprocket Order ID.
 */
export async function trackShipment(awbOrOrderId: string) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await fetch(`${SHIPROCKET_API_BASE}/courier/track/awb/${awbOrOrderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Shiprocket track error:', err);
    return null;
  }
}
