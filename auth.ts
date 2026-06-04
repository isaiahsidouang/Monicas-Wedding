import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.compose',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Fresh sign-in — store tokens and expiry
      if (account) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          expiresAt:    account.expires_at, // seconds since epoch
        }
      }

      // Token still valid — return as-is
      if (Date.now() < (token.expiresAt as number) * 1000 - 60_000) {
        return token
      }

      // Token expired — refresh it
      try {
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id:     process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type:    'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        })
        const refreshed = await res.json()
        if (!res.ok) throw refreshed

        return {
          ...token,
          accessToken: refreshed.access_token,
          expiresAt:   Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
          // Keep existing refresh token if a new one wasn't issued
          refreshToken: (refreshed.refresh_token as string | undefined) ?? token.refreshToken,
        }
      } catch (err) {
        console.error('Token refresh failed:', err)
        return { ...token, error: 'RefreshTokenError' }
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      if (token.error === 'RefreshTokenError') {
        // Signal to the UI that the user needs to re-authenticate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session as any).error = 'RefreshTokenError'
      }
      return session
    },
  },
})
