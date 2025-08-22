import NextAuth from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

// 환경 변수 체크
const hasTwitterCredentials = process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET;

const providers = [];

if (hasTwitterCredentials) {
  providers.push(
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    })
  );
}

const handler = NextAuth({
  providers,
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development",
  pages: {
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.twitterId = (profile as any).id_str || (profile as any).id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.username = (profile as any).screen_name || (profile as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).accessToken = token.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).twitterId = token.twitterId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).username = token.username;
      }
      return session
    },
  }
})

export { handler as GET, handler as POST }
