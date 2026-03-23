"use client";
import { useAuthStore } from "@/store/authStore";
import TeachersManagement from "@/components/dashboard/TeachersManagement";
import SchoolTeachersPage from "@/components/dashboard/SchoolTeachersPage";

export default function TeachersPage() {
  const { user } = useAuthStore();
  return user?.role === "school" ? <SchoolTeachersPage /> : <TeachersManagement />;
}
