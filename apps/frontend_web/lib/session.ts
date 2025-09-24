import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper function to get session on server-side
export const getUserSession = async () => {
  const session = await getServerSession(authOptions);
  return session;
};
