import { NextRequest, NextResponse } from 'next/server'
import { restoreExpiredOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is configured in production, verify header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restoredCount = await restoreExpiredOrders(30)
    return NextResponse.json({
      success: true,
      restoredCount,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cron restore expired orders error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
