import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { restoreExpiredOrders } from '@/lib/orders'

export async function POST() {
  try {
    await requireAdmin()
    const restoredCount = await restoreExpiredOrders(30)
    return NextResponse.json({ success: true, restoredCount })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message?.startsWith('FORBIDDEN')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
