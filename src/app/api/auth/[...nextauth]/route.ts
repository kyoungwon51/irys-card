import NextAuth from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

const handler = NextAuth({
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read follows.read",
        },
      },
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // 개발 중 디버깅 활성화
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.twitterId = (profile as any).data?.id || (profile as any).id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.username = (profile as any).data?.username || (profile as any).username
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
    error: '/auth/error', // 에러 페이지 커스터마이징
  }
})

export { handler as GET, handler as POST }
