import GoogleProvider from "next-auth/providers/google";
import { prisma } from '@/lib/prisma'
import { NextAuthOptions } from "next-auth";

const GOOGLE_CLIENT_ID = process.env.AUTH_GOOGLE_ID as string
const GOOGLE_CLIENT_SECRET = process.env.AUTH_GOOGLE_SECRET as string

const authOptions: NextAuthOptions = {
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
        async signIn({ account, profile}){
            if (!profile?.email){
                throw new Error('No email found from Google Account')
            }

            await prisma.accounts.upsert({
                where: { email: profile.email },
                create: {
                    email: profile.email,
                    name: profile.name,
                },
                update: {
                    name: profile.name,
                }
            })
            return true
        }
    }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }