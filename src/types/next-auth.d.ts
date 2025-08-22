import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      twitterId?: string
      username?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    twitterId?: string
    username?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    twitterId?: string
    username?: string
  }
}
