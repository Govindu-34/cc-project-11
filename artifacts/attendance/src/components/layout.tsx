import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Clock, History, Cloud } from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: Clock },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden text-foreground">
      {/* Sidebar */}
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
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" 
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 mt-auto">
          <div className="glass-panel rounded-2xl p-4 bg-white/20 dark:bg-white/5 border-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 border-2 border-white dark:border-gray-800" />
              <div>
                <div className="text-sm font-medium">Admin User</div>
                <div className="text-xs text-muted-foreground">admin@organization.com</div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
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
