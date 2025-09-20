import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Helper function to get session on server-side
export const getUserSession = async () => {
  const session = await getServerSession(authOptions);
  return session;
};
