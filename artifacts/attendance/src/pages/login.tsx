import React, { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, LogIn, Loader2 } from "lucide-react";
import { authLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refresh } = useAuth();
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authLogin({ email, password });
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast({ title: "Sign in failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Cloud className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Cloud Attendance</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            <span>Sign in</span>
          </button>
        </form>

        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <div className="font-medium text-foreground/70">Demo accounts</div>
          <div>Admin: ava.chen@cloudattend.io / admin123</div>
          <div>User: marcus.reyes@cloudattend.io / user123</div>
        </div>
      </motion.div>
    </div>
  );
}
