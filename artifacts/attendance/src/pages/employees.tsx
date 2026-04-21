import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  useListEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, MoreVertical, Edit2, Trash2, Mail, Briefcase, Building, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  password: z.string().min(4, "Password must be at least 4 characters").or(z.literal("")),
  accountRole: z.enum(["admin", "user"]).default("user"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Employees() {
  const [search, setSearch] = useState("");
  const { data: employees, isLoading } = useListEmployees({ search });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", department: "", role: "", password: "", accountRole: "user" }
  });

  const openCreateModal = () => {
    setEditingId(null);
    form.reset({ name: "", email: "", department: "", role: "", password: "", accountRole: "user" });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: any) => {
    setEditingId(emp.id);
    form.reset({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      password: "",
      accountRole: emp.accountRole ?? "user",
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: FormValues) => {
    if (editingId) {
      const updateData: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        department: values.department,
        role: values.role,
        accountRole: values.accountRole,
      };
      if (values.password) updateData.password = values.password;
      updateEmployee.mutate(
        { id: editingId, data: updateData },
        {
          onSuccess: () => {
            toast({ title: "Employee updated" });
            queryClient.invalidateQueries();
            setIsModalOpen(false);
          }
        }
      );
    } else {
      if (!values.password) {
        toast({ title: "Password required", description: "Provide an initial password for the new account.", variant: "destructive" });
        return;
      }
      createEmployee.mutate(
        { data: { ...values, password: values.password } },
        {
          onSuccess: () => {
            toast({ title: "Employee created" });
            queryClient.invalidateQueries();
            setIsModalOpen(false);
          }
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to delete this employee?")) {
      deleteEmployee.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Employee deleted" });
            queryClient.invalidateQueries();
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees Directory</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="glass-panel p-2 rounded-2xl flex items-center z-10 relative">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name, email or department..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-black/20 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 glass-panel rounded-3xl animate-pulse bg-white/20 dark:bg-white/5" />)}
          </div>
        ) : employees?.length === 0 ? (
           <div className="h-full flex items-center justify-center">
             <div className="glass-panel p-12 rounded-3xl text-center max-w-sm">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-6">Try a different search term or add a new employee.</p>
                <button onClick={openCreateModal} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium">Add Employee</button>
             </div>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {employees?.map((emp, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={emp.id} 
                className="glass-panel p-6 rounded-3xl group hover:-translate-y-1 transition-all duration-300 relative"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 bg-white/40 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 rounded-xl backdrop-blur-md transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-panel border-none rounded-xl p-1 w-40">
                      <DropdownMenuItem onClick={() => openEditModal(emp)} className="rounded-lg cursor-pointer focus:bg-white/30 dark:focus:bg-white/10">
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(emp.id)} className="rounded-lg cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col items-center text-center mb-6 mt-2">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4" style={{ background: emp.avatarColor }}>
                    {emp.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{emp.name}</h3>
                  <p className="text-primary font-medium text-sm mt-1 bg-primary/10 px-3 py-1 rounded-full">{emp.role}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Building className="w-4 h-4 text-muted-foreground/70" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground/70" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glass-panel border-none sm:rounded-3xl p-0 max-w-md overflow-hidden">
          <div className="p-6 border-b border-border/30 bg-white/10 dark:bg-black/10">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {editingId ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <input {...field} className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Jane Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <input {...field} type="email" className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary" placeholder="jane@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <input {...field} className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Engineering" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <input {...field} className="w-full p-3 rounded-xl bg-white/40 dark:bg-black/20 border border-border focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Developer" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="p-6 pt-0 flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createEmployee.isPending || updateEmployee.isPending}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 shadow-md"
                >
                  {(createEmployee.isPending || updateEmployee.isPending) ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
