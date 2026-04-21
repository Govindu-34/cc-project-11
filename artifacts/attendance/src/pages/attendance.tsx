import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  useGetTodayAttendance,
  useCheckIn,
  useCheckOut,
  useListEmployees
} from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Clock, LogIn, LogOut, MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Attendance() {
  const { data: attendanceList, isLoading } = useGetTodayAttendance();
  const { data: employees } = useListEmployees();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedEmployeeForCheckIn, setSelectedEmployeeForCheckIn] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const handleCheckIn = () => {
    if (!selectedEmployeeForCheckIn) return;
    checkIn.mutate(
      { data: { employeeId: selectedEmployeeForCheckIn } },
      {
        onSuccess: () => {
          toast({ title: "Checked in successfully" });
          queryClient.invalidateQueries();
          setIsCheckInModalOpen(false);
          setSelectedEmployeeForCheckIn(null);
        },
        onError: () => toast({ title: "Failed to check in", variant: "destructive" })
      }
    );
  };

  const handleCheckOut = (employeeId: number) => {
    checkOut.mutate(
      { data: { employeeId } },
      {
        onSuccess: () => {
          toast({ title: "Checked out successfully" });
          queryClient.invalidateQueries();
        },
        onError: () => toast({ title: "Failed to check out", variant: "destructive" })
      }
    );
  };

  const filteredList = attendanceList?.filter(record => {
    const matchesSearch = record.employee.name.toLowerCase().includes(search.toLowerCase()) || 
                          record.employee.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'present': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'late': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      case 'absent': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30';
      case 'on_leave': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today's Attendance</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button 
          onClick={() => setIsCheckInModalOpen(true)}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Manual Check In
        </button>
      </div>

      <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2 items-center z-10 relative">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search employees or departments..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-black/20 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'present', 'late', 'absent', 'on_leave'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-white/50 dark:hover:bg-black/30'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-white/20 dark:bg-white/5">
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Employee</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Department</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Check In</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Check Out</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12">Loading...</td></tr>
              ) : filteredList?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium">No records found</p>
                      <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList?.map((record, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={record.id} 
                    className="border-b border-border/30 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm" style={{ background: record.employee.avatarColor }}>
                          {record.employee.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{record.employee.name}</div>
                          <div className="text-xs text-muted-foreground">{record.employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{record.employee.department}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {record.checkInTime ? format(parseISO(record.checkInTime), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {record.checkOutTime ? format(parseISO(record.checkOutTime), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.checkInTime && !record.checkOutTime && (
                        <button 
                          onClick={() => handleCheckOut(record.employeeId)}
                          className="px-4 py-1.5 text-sm font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-xl transition-colors inline-flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Check Out
                        </button>
                      )}
                      {!record.checkInTime && (
                         <button 
                         onClick={() => {
                           setSelectedEmployeeForCheckIn(record.employeeId);
                           handleCheckIn();
                         }}
                         className="px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors inline-flex items-center gap-2"
                       >
                         <LogIn className="w-3.5 h-3.5" /> Check In
                       </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
        <DialogContent className="glass-panel border-none sm:rounded-3xl p-6 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Manual Check In</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <select 
                className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedEmployeeForCheckIn || ""}
                onChange={(e) => setSelectedEmployeeForCheckIn(Number(e.target.value))}
              >
                <option value="">Select someone...</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsCheckInModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCheckIn}
              disabled={!selectedEmployeeForCheckIn || checkIn.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            >
              {checkIn.isPending ? "Processing..." : "Check In"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
