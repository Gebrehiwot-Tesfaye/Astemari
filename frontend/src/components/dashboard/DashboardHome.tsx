"use client";
import { useAuthStore } from "@/store/authStore";
import TeacherDashboard from "./TeacherDashboard";
import SchoolDashboard from "./SchoolDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardHome() {
  const { user } = useAuthStore();

  if (user?.role === "admin") return <AdminDashboard />;
  if (user?.role === "school") return <SchoolDashboard />;
  return <TeacherDashboard />;
}
