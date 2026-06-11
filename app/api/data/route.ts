import { auth } from '@/auth'
import { supabase } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const key = new URL(req.url).searchParams.get('key')
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 })

  const { data, error } = await supabase
    .from('user_data')
    .select('value')
    .eq('user_email', session.user.email)
    .eq('key', key)
    .single()

  if (error || !data) return Response.json({ value: null })
  return Response.json({ value: data.value })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { key, value } = await req.json()
  if (!key) return Response.json({ error: 'Missing key' }, { status: 400 })

  const { error } = await supabase
    .from('user_data')
    .upsert({ user_email: session.user.email, key, value, updated_at: new Date().toISOString() })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
