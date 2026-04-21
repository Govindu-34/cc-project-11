import React, { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, X, Filter, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListLeaves,
  useApproveLeave,
  useRejectLeave,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const tabs = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function LeavesAdmin() {
  const [tab, setTab] = useState<TabKey>("pending");
  const status = tab === "all" ? undefined : tab;
  const { data: leaves, isLoading } = useListLeaves(
    status ? { status } : {},
  );
  const qc = useQueryClient();
  const { toast } = useToast();

  const approve = useApproveLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave approved" });
        qc.invalidateQueries();
      },
    },
  });
  const reject = useRejectLeave({
    mutation: {
      onSuccess: () => {
        toast({ title: "Leave rejected" });
        qc.invalidateQueries();
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leave Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Approve or reject employee leave submissions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl glass-panel p-1">
          <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-sm transition ${
                tab === t.key
                  ? "bg-white/60 dark:bg-white/10 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !leaves?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            No {tab === "all" ? "" : tab} leave requests.
          </div>
        ) : (
          <div className="divide-y divide-white/20">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{l.employeeName ?? "—"}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <CalendarDays className="h-4 w-4" />
                    {format(parseISO(l.startDate as unknown as string), "MMM d")} →{" "}
                    {format(parseISO(l.endDate as unknown as string), "MMM d, yyyy")}
                  </div>
                  <div className="text-sm mt-2">{l.reason}</div>
                </div>
                {l.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve.mutate({ id: l.id })}
                      disabled={approve.isPending}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => reject.mutate({ id: l.id })}
                      disabled={reject.isPending}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-2xl bg-white/40 dark:bg-white/5 text-sm font-medium hover:bg-white/60 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-rose-500/20 text-rose-700 dark:text-rose-300",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full capitalize ${styles[status] ?? "bg-white/30"}`}
    >
      {status}
    </span>
  );
}
