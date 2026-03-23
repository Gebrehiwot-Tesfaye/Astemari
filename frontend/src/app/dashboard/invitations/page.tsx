"use client";
import { useAuthStore } from "@/store/authStore";
import InvitationsPage from "@/components/dashboard/InvitationsPage";
import AdminInvitationsPage from "@/components/dashboard/AdminInvitationsPage";

export default function Page() {
  const { user } = useAuthStore();
  return user?.role === "admin" ? <AdminInvitationsPage /> : <InvitationsPage />;
}
