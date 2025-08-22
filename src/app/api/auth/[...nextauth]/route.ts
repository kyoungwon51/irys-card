import NextAuth from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // OAuth 2.0 대신 1.0a 시도
      version: "1.0A",
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        // OAuth 1.0a의 경우 profile 구조가 다를 수 있음
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.twitterId = (profile as any).id_str || (profile as any).id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.username = (profile as any).screen_name || (profile as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.accessToken = token.accessToken as string
        session.user.twitterId = token.twitterId as string
        session.user.username = token.username as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // OAuth 후 리다이렉트 처리
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    error: '/auth/error',
  }
})

export { handler as GET, handler as POST }
