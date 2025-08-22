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
      version: "2.0",
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "users.read tweet.read offline.access",
        },
      },
      userinfo: {
        url: "https://api.twitter.com/2/users/me?user.fields=description,profile_image_url,public_metrics,verified,location",
        async request({ tokens }) {
          const response = await fetch(
            "https://api.twitter.com/2/users/me?user.fields=description,profile_image_url,public_metrics,verified,location",
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );
          return await response.json();
        },
      },
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
      console.log('JWT Callback - Account:', account);
      console.log('JWT Callback - Profile:', profile);
      
      if (account && profile) {
        token.accessToken = account.access_token
        // Twitter API v2 response 구조에 맞게 수정
        const userData = (profile as { data?: { id?: string; username?: string; name?: string; profile_image_url?: string }; id?: string; username?: string; name?: string; profile_image_url?: string }).data || profile;
        const typedUserData = userData as { id?: string; username?: string; name?: string; profile_image_url?: string };
        
        console.log('User data extracted:', typedUserData);
        
        token.twitterId = typedUserData.id
        token.username = typedUserData.username
        token.profileImage = typedUserData.profile_image_url
        token.displayName = typedUserData.name
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback - Token:', token);
      
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).accessToken = token.accessToken;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).twitterId = token.twitterId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).username = token.username;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).profileImage = token.profileImage;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).displayName = token.displayName;
      }
      
      console.log('Final session:', session);
      return session
    },
  }
})

export { handler as GET, handler as POST }
