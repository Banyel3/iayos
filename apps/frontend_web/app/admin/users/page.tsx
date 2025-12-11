import { redirect } from "next/navigation";

export default function UsersPage() {
  // This page should not be accessible - redirect to workers page
  redirect("/admin/users/workers");
}
