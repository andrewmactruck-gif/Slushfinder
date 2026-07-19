import { NextRequest, NextResponse } from 'next/server'
import { adminDb, isAdminRequest } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = adminDb()
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 100 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = data.users.map(u => u.id)
  const { data: profiles } = await db.from('profiles').select('id,role').in('id', ids)
  const roleMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.role]))
  const users = data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in: u.last_sign_in_at, confirmed: !!u.confirmed_at, role: roleMap[u.id] ?? 'user' }))
  return NextResponse.json({ users })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  const action = req.nextUrl.searchParams.get('action') ?? 'delete'
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const db = adminDb()
  if (action === 'ban') {
    const { error } = await db.auth.admin.updateUserById(id, { ban_duration: '876000h' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'banned' })
  }
  const { error } = await db.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, action: 'deleted' })
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, role } = await req.json()
  if (!userId || !['user','admin'].includes(role)) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const { error } = await adminDb().from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
