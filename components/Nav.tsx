'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Heart, Mail, Search, FileText, CheckSquare, DollarSign, Users, FileCheck, Clock, LogIn, LogOut } from 'lucide-react'

const links = [
  { href: '/', label: 'Home', icon: Heart },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/budget', label: 'Budget', icon: DollarSign },
  { href: '/vendors', label: 'Vendors', icon: Users },
  { href: '/contracts', label: 'Contracts', icon: FileCheck },
  { href: '/timeline', label: 'Day-Of', icon: Clock },
  { href: '/scan', label: 'Scan Inbox', icon: Mail },
  { href: '/venues', label: 'Venues', icon: Search },
  { href: '/drafts', label: 'Drafts', icon: FileText },
]

export default function Nav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: 'var(--nav-bg)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Brand */}
        <span className="font-semibold text-sm shrink-0 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
          💍 Monica&apos;s Wedding
        </span>

        {/* Links — horizontally scrollable */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0"
                style={{
                  background: active ? 'var(--accent-light)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={13} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Auth */}
        <div className="shrink-0">
          {status === 'loading' ? null : session ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <LogIn size={12} />
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
