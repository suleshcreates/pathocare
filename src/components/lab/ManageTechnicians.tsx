import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Phone, Users, CheckCircle2, XCircle } from 'lucide-react';
import { labService } from '@/services/labService';
import { toast } from 'sonner';

export function ManageTechnicians() {
    const [technicians, setTechnicians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    });

    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const data = await labService.getTechnicians();
            setTechnicians(data);
        } catch (error) {
            console.error("Failed to fetch technicians", error);
            toast.error("Failed to load technicians");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // NOTE: Client-side creation is limited. 
            // We will try to call the service, but it might throw an error requesting backend.
            // For demo purposes, we will simulate success if standard creation fails, 
            // OR explicitly tell the user to use the seed script.
            try {
                await labService.createTechnician(formData);
                toast.success("Technician added successfully");
                setOpen(false);
                fetchTechnicians();
            } catch (err: any) {
                if (err.message.includes("backend")) {
                    toast.info("Technician creation requires backend API. Please use the seed script for this hackathon demo.");
                } else {
                    toast.error("Failed to add technician: " + err.message);
                }
            }
        } catch (error) {
            console.error("Error adds technician", error);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await labService.activateTechnician(id, !currentStatus);
            toast.success(`Technician ${!currentStatus ? 'activated' : 'deactivated'}`);
            fetchTechnicians();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Technicians</h1>
                    <p className="text-slate-500 mt-1">Add and manage your field staff.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add Technician
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Technician</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Rahul Verma"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="technician@lab.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Set a secure password"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Create Account
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {technicians.map((tech) => (
                    <Card key={tech.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900">{tech.name}</CardTitle>
                                    <p className="text-xs text-slate-500">{tech.id.slice(0, 8)}...</p>
                                </div>
                            </div>
                            <Badge variant={tech.isActive ? 'default' : 'secondary'} className={tech.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500'}>
                                {tech.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3 mt-2">
                                <div className="flex items-center text-sm text-slate-600">
                                    <Phone className="w-4 h-4 mr-2 text-slate-400" />
                                    {tech.phone || 'N/A'}
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={tech.isActive ? "flex-1 text-red-600 hover:bg-red-50 hover:text-red-700" : "flex-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"}
                                        onClick={() => handleToggleStatus(tech.id, tech.isActive)}
                                    >
                                        {tech.isActive ? (
                                            <><XCircle className="w-4 h-4 mr-2" /> Deactivate</>
                                        ) : (
                                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Activate</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {technicians.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                        <p>No technicians found. Add one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
