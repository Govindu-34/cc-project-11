import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  useListAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useListEmployees
} from "@workspace/api-client-react";
import { format, parseISO, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Filter, MoreHorizontal, Edit2, Trash2, History as HistoryIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function History() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  
  const { data: records, isLoading } = useListAttendance({ 
    date: date ? format(date, 'yyyy-MM-dd') : undefined,
    employeeId
  });
  
  const { data: employees } = useListEmployees();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  const [editStatus, setEditStatus] = useState<any>("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditStatus(record.status);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingRecord) return;
    updateAttendance.mutate(
      { id: editingRecord.id, data: { status: editStatus } },
      {
        onSuccess: () => {
          toast({ title: "Record updated" });
          queryClient.invalidateQueries();
          setIsEditModalOpen(false);
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if(confirm("Delete this attendance record completely?")) {
      deleteAttendance.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Record deleted" });
            queryClient.invalidateQueries();
          }
        }
      );
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
          <p className="text-muted-foreground">View and manage past attendance records</p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center z-10 relative">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/40 dark:bg-black/20 rounded-xl hover:bg-white/60 dark:hover:bg-black/40 transition-colors">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span>{date ? format(date, "PPP") : "Pick a date"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 glass-panel border-none rounded-2xl" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white/40 dark:bg-black/20 rounded-xl flex-1 min-w-[200px]">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            className="w-full bg-transparent border-none focus:outline-none text-sm"
            value={employeeId || ""}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Employees</option>
            {employees?.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={() => { setDate(undefined); setEmployeeId(undefined); }}
          className="px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear Filters
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-white/20 dark:bg-white/5">
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Date</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Employee</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Check In</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground">Check Out</th>
                <th className="px-6 py-4 font-medium text-sm text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12">Loading...</td></tr>
              ) : records?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <HistoryIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium">No history found</p>
                      <p className="text-muted-foreground text-sm mt-1">Try selecting a different date or employee</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records?.map((record: any, i: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={record.id} 
                    className="border-b border-border/30 hover:bg-white/30 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium">
                      {format(parseISO(record.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm" style={{ background: record.employee.avatarColor }}>
                          {record.employee.name.charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{record.employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.checkInTime ? format(parseISO(record.checkInTime), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {record.checkOutTime ? format(parseISO(record.checkOutTime), 'h:mm a') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-white/40 dark:hover:bg-black/20 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel border-none rounded-xl p-1">
                          <DropdownMenuItem onClick={() => openEditModal(record)} className="rounded-lg cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(record.id)} className="rounded-lg cursor-pointer text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="glass-panel border-none sm:rounded-3xl p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold mb-4">Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Employee</label>
              <div className="font-medium">{editingRecord?.employee.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-1">Date</label>
              <div className="font-medium">{editingRecord && format(parseISO(editingRecord.date), 'MMMM d, yyyy')}</div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2 mt-4">Update Status</label>
              <select 
                className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleEditSubmit}
              disabled={updateAttendance.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            >
              {updateAttendance.isPending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
