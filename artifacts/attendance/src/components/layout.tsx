import React from "react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { LayoutDashboard, Users, Clock, History, Cloud, LogOut, UserCircle, CalendarCheck, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { authLogout } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { ChangePasswordModal } from "@/components/change-password-modal";

type Role = "admin" | "user";

const adminLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/leaves", label: "Leaves", icon: CalendarCheck },
  { href: "/me", label: "My check-in", icon: UserCircle },
];

const userLinks = [
  { href: "/", label: "My check-in", icon: UserCircle },
];

export function Layout({ children, role }: { children: React.ReactNode; role: Role }) {
  const [location] = useLocation();
  const { user, signOut, refresh } = useAuth();
  const links = role === "admin" ? adminLinks : userLinks;
  const [pwOpen, setPwOpen] = useState(false);

  async function handleSignOut() {
    try {
      await authLogout();
    } catch {
      // ignore
    }
    signOut();
    await refresh();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      <motion.aside
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 flex-shrink-0 m-4 mr-0 rounded-3xl glass-panel flex flex-col relative z-20 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Cloud className="h-6 w-6" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Cloud Attendance</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {links.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href} className="block">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out cursor-pointer ${
                    isActive
                      ? "bg-white/40 dark:bg-white/10 shadow-sm font-medium"
                      : "hover:bg-white/20 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <link.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                  <span>{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto space-y-3">
          <div className="glass-panel rounded-2xl p-4 bg-white/20 dark:bg-white/5 border-none">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-sm font-semibold"
                style={{ background: `linear-gradient(135deg, ${user?.avatarColor ?? "#7c3aed"}, #6366f1)` }}
              >
                {user?.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-xs text-muted-foreground truncate capitalize">
                  {role === "admin" ? "Administrator" : user?.role}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => setPwOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/30 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-sm font-medium transition"
          >
            <KeyRound className="h-4 w-4" /> Change password
          </button>
          <button
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/30 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 text-sm font-medium transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
          <ChangePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
        </div>
      </motion.aside>

      <main className="flex-1 relative h-full overflow-y-auto p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="h-full rounded-3xl glass-panel p-8 overflow-y-auto"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
