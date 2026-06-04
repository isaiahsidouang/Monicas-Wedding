'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Heart, Mail, Search, FileText, Download, LogIn, LogOut } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: Heart },
  { href: '/scan', label: 'Scan Inbox', icon: Mail },
  { href: '/venues', label: 'Find Venues', icon: Search },
  { href: '/drafts', label: 'Drafts', icon: FileText },
]

export default function Nav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  return (
    <nav
      className="sticky top-0 z-50 border-b flex items-center justify-between px-6 py-3"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-8">
        <span className="font-semibold tracking-wide text-sm" style={{ color: 'var(--accent)' }}>
          💍 Monica&apos;s Wedding
        </span>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{
                  background: active ? 'rgba(201,169,110,0.12)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status === 'loading' ? null : session ? (
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: '#0c0a08' }}
          >
            <LogIn size={14} />
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  )
}
