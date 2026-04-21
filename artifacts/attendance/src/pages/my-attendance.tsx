import React from "react";
import { motion } from "framer-motion";
import { LogIn, LogOut, CalendarDays, CheckCircle2, Timer, Loader2, Plane, Send } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  useGetMyToday,
  useGetMyHistory,
  useMyCheckIn,
  useMyCheckOut,
  useListMyLeaves,
  useCreateLeave,
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
  const { data: myLeaves } = useListMyLeaves();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [leaveStart, setLeaveStart] = React.useState("");
  const [leaveEnd, setLeaveEnd] = React.useState("");
  const [leaveReason, setLeaveReason] = React.useState("");

  const createLeave = useCreateLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave request submitted" });
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        qc.invalidateQueries();
      },
      onError: (e) => toast({ title: "Failed", description: String(e), variant: "destructive" }),
    },
  });

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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel rounded-3xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Plane className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Request leave</h3>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!leaveStart || !leaveEnd || !leaveReason.trim()) return;
            createLeave.mutate({
              data: { startDate: leaveStart, endDate: leaveEnd, reason: leaveReason },
            });
          }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <input
            type="date"
            required
            value={leaveStart}
            onChange={(e) => setLeaveStart(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="date"
            required
            value={leaveEnd}
            onChange={(e) => setLeaveEnd(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            disabled={createLeave.isPending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow disabled:opacity-60"
          >
            {createLeave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit
          </button>
          <textarea
            required
            placeholder="Reason for leave..."
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            className="sm:col-span-3 px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px]"
          />
        </form>

        <div className="mt-6 divide-y divide-white/20">
          {(myLeaves ?? []).map((l) => (
            <div key={l.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {format(parseISO(l.startDate as unknown as string), "MMM d")} →{" "}
                  {format(parseISO(l.endDate as unknown as string), "MMM d, yyyy")}
                </div>
                <div className="text-xs text-muted-foreground">{l.reason}</div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  l.status === "approved"
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : l.status === "rejected"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {l.status}
              </span>
            </div>
          ))}
          {!myLeaves?.length && (
            <div className="py-6 text-center text-muted-foreground text-sm">No leave requests yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
