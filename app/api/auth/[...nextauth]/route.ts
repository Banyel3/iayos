import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";
import { prisma } from '@/lib/prisma'
import { NextAuthOptions } from "next-auth";
import { Prisma } from "@/lib/generated/prisma/wasm";

const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID!
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET!

interface GoogleProfile {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}


 export const authOptions: NextAuthOptions = {

    
    session:{
        strategy: 'jwt',
    },
    providers: [
        GoogleProvider({
            clientId: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
        })
    ],
    callbacks: {
         async redirect({ url, baseUrl }) {
      // Example: always redirect to /dashboard after login
      return `${baseUrl}/dashboard`;
    },
    
        async signIn({ account, profile}){
            const googleProfile = profile as GoogleProfile
            if (!profile?.email){
                throw new Error('No email found from Google Account')
            }
             const accountRecord = await prisma.accounts.upsert({
        where: { email: profile.email },
                create: {
                    email: profile.email,
                    password: "", // leave blank for OAuth accounts
                    isVerified: true,
                    status: "ACTIVE",
                } as Prisma.AccountsUncheckedCreateInput,
                update: {
                    isVerified: true,
                    status: "ACTIVE",
                },
            });

            await prisma.profile.upsert({
                where: { accountID: accountRecord.accountID },
                create: {
                    accountID: accountRecord.accountID,
                    firstName: googleProfile.given_name,
                    lastName: googleProfile.family_name,
                    contactNum: "",
                    profileImg: googleProfile.picture,
                } as Prisma.ProfileUncheckedCreateInput,
                update: {
                    firstName: googleProfile.given_name,
                    lastName: googleProfile.family_name,
                    profileImg: googleProfile.picture,
                },
            });

            return true
        }
    }
}
       
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }