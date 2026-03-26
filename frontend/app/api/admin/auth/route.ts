import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  const adminPassword = process.env.ADMIN_PASSWORD
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminPassword || !adminSecret) {
    return NextResponse.json({ error: 'Server non configurato correttamente' }, { status: 500 })
  }

  if (password !== adminPassword) {
    return NextResponse.json({ error: 'Password non corretta' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('admin_token', adminSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 giorni
    path: '/',
  })
  return response
}
