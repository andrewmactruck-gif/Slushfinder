import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const adminDb = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  try {
    const auth = req.headers.get('authorization') ?? ''
    const token = auth.replace('Bearer ', '').trim()
    if (!token) return false
    const db = adminDb()
    const { data: { user } } = await db.auth.getUser(token)
    if (!user) return false
    const { data } = await db.from('profiles').select('role').eq('id', user.id).single()
    return data?.role === 'admin'
  } catch { return false }
}
