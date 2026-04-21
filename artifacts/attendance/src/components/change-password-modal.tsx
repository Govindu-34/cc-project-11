import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { authChangePassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";

export function ChangePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNewP] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authChangePassword({ currentPassword, newPassword });
      toast({ title: "Password updated" });
      setCurrent("");
      setNewP("");
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Could not change password",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-none rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Change password
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">New password</label>
            <input
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewP(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <DialogFooter>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium shadow disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
