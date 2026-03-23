"use client";
import { useAuthStore } from "@/store/authStore";
import ApplicationsPage from "@/components/dashboard/ApplicationsPage";
import AdminApplicationsPage from "@/components/dashboard/AdminApplicationsPage";

export default function Page() {
  const { user } = useAuthStore();
  return user?.role === "admin" ? <AdminApplicationsPage /> : <ApplicationsPage />;
}
