import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "./components/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookies (await needed)
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;

  // If no token → redirect
  if (!token) redirect("/login");

  return (
    <div>
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
