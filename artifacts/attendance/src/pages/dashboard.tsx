import React from "react";
import { motion } from "framer-motion";
import { 
  useGetStatsSummary, 
  useGetWeeklyTrend, 
  useGetStatsByDepartment, 
  useGetRecentActivity,
  useCheckIn,
  useListEmployees
} from "@workspace/api-client-react";
import { format, parseISO } from "date-fns";
import { 
  Users, CheckCircle2, AlertCircle, Clock, Timer, Activity, TrendingUp, Building2, UserCircle 
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats } = useGetStatsSummary();
  const { data: trend } = useGetWeeklyTrend();
  const { data: deptStats } = useGetStatsByDepartment();
  const { data: activities } = useGetRecentActivity({ limit: 10 });
  const { data: employees } = useListEmployees();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkIn = useCheckIn();

  const handleQuickCheckIn = (employeeId: number) => {
    checkIn.mutate(
      { data: { employeeId } },
      {
        onSuccess: () => {
          toast({ title: "Checked in successfully" });
          queryClient.invalidateQueries();
        },
        onError: (err) => {
          toast({ title: "Failed to check in", variant: "destructive" });
        }
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Good Morning</h1>
        <p className="text-muted-foreground text-lg">Here's what's happening today.</p>
      </div>

      {stats ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Present Today", value: stats.presentToday, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Late Today", value: stats.lateToday, icon: Timer, color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { label: "Absent Today", value: stats.absentToday, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants} className="glass-panel p-6 rounded-3xl flex items-start justify-between group hover:-translate-y-1 transition-transform duration-300">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 glass-panel rounded-3xl animate-pulse bg-white/20 dark:bg-white/5" />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Trend
              </h2>
            </div>
            <div className="h-[300px] w-full">
              {trend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(val) => format(parseISO(val), 'MMM d')} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: '#000' }}
                    />
                    <Area type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" />
                    <Area type="monotone" dataKey="late" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorLate)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">Loading...</div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Department Breakdown
              </h2>
            </div>
            <div className="h-[250px] w-full">
              {deptStats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptStats} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.1)'}}
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', border: 'none', borderRadius: '16px' }}
                    />
                    <Bar dataKey="present" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="late" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">Loading...</div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="space-y-8"
        >
          {/* Quick Check-In Widget */}
          <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 border border-white/50 dark:border-white/10 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 relative z-10">
              <Clock className="w-5 h-5 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-3 relative z-10">
              {employees?.slice(0, 3).map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/30 dark:bg-black/20 hover:bg-white/50 dark:hover:bg-black/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: emp.avatarColor }}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.department}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleQuickCheckIn(emp.id)}
                    className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-transform active:scale-95"
                    disabled={checkIn.isPending}
                  >
                    Check In
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Recent Activity
            </h2>
            <div className="space-y-6">
              {activities?.map((act, i) => (
                <div key={act.id} className="flex gap-4 relative">
                  {i !== activities.length - 1 && (
                    <div className="absolute top-8 left-[19px] bottom-[-24px] w-px bg-border/50" />
                  )}
                  <div className="relative z-10 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium shadow-sm border border-white/20" style={{ background: act.avatarColor || '#ccc' }}>
                    {act.employeeName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{act.employeeName}</span>
                      <span className="text-muted-foreground"> 
                        {act.action === 'check_in' ? ' checked in' : ' checked out'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(act.timestamp), 'h:mm a')} • {act.department}
                    </p>
                  </div>
                </div>
              ))}
              {activities?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
