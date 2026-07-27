import type { Metadata } from "next";

import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLogin } from "@/components/AdminLogin";
import { isAdmin } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "Admin · Stuart Softball League '26",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  return (await isAdmin()) ? <AdminDashboard /> : <AdminLogin />;
}
