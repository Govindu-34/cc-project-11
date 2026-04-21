import React from "react";
import { motion } from "framer-motion";
import { Clock, LogIn, LogOut, CalendarDays, CheckCircle2, Timer, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  useGetMyToday,
  useGetMyHistory,
  useMyCheckIn,
  useMyCheckOut,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

function formatTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, "h:mm a");
}

export default function MyAttendance() {
  const { user } = useAuth();
  const { data: today, isLoading } = useGetMyToday();
  const { data: history } = useGetMyHistory({ limit: 14 });
  const qc = useQueryClient();
  const { toast } = useToast();

  const checkIn = useMyCheckIn({
    mutation: {
      onSuccess: () => {
        toast({ title: "Checked in", description: "Have a great day." });
        qc.invalidateQueries();
      },
      onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
    },
  });
  const checkOut = useMyCheckOut({
    mutation: {
      onSuccess: () => {
        toast({ title: "Checked out", description: "See you tomorrow." });
        qc.invalidateQueries();
      },
      onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
    },
  });

  const record = today?.record ?? null;
  const hasCheckedIn = !!record?.checkInTime;
  const hasCheckedOut = !!record?.checkOutTime;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md text-lg font-semibold"
            style={{ background: `linear-gradient(135deg, ${user?.avatarColor ?? "#7c3aed"}, #6366f1)` }}
          >
            {user?.name.charAt(0)}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Welcome</div>
            <h2 className="text-2xl font-semibold tracking-tight">{user?.name}</h2>
            <div className="text-sm text-muted-foreground">{user?.role} • {user?.department}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/40 dark:bg-white/5 p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <CalendarDays className="h-4 w-4" /> Today
            </div>
            <div className="mt-2 text-lg font-medium">{format(new Date(), "EEEE, MMM d")}</div>
          </div>
          <div className="rounded-2xl bg-white/40 dark:bg-white/5 p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <LogIn className="h-4 w-4" /> Checked in
            </div>
            <div className="mt-2 text-lg font-medium">{formatTime(record?.checkInTime)}</div>
          </div>
          <div className="rounded-2xl bg-white/40 dark:bg-white/5 p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <LogOut className="h-4 w-4" /> Checked out
            </div>
            <div className="mt-2 text-lg font-medium">{formatTime(record?.checkOutTime)}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => checkIn.mutate({ data: {} })}
            disabled={isLoading || hasCheckedIn || checkIn.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Check in
          </button>
          <button
            onClick={() => checkOut.mutate({ data: {} })}
            disabled={isLoading || !hasCheckedIn || hasCheckedOut || checkOut.isPending}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {checkOut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Check out
          </button>
          {record?.status && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-white/5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Status: <strong className="capitalize">{record.status.replace("_", " ")}</strong>
            </span>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-3xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Timer className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Recent attendance</h3>
        </div>
        <div className="divide-y divide-white/20">
          {(history ?? []).map((h) => (
            <div key={h.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{format(parseISO(h.date), "EEE, MMM d")}</div>
                <div className="text-xs text-muted-foreground capitalize">{h.status.replace("_", " ")}</div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatTime(h.checkInTime)} → {formatTime(h.checkOutTime)}
              </div>
            </div>
          ))}
          {!history?.length && (
            <div className="py-8 text-center text-muted-foreground">No attendance history yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
