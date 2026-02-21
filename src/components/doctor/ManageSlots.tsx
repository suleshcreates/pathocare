import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Video, Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { doctorService } from '@/services/doctorService';
import { toast } from 'sonner';
import type { DoctorSlot, ConsultationType } from '@/types';

export function ManageSlots() {
    const { user } = useAuth();
    const [slots, setSlots] = useState<DoctorSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        slotDate: '',
        startTime: '09:00',
        endTime: '09:30',
        consultationType: 'video' as ConsultationType
    });

    const fetchSlots = async () => {
        if (!user?.id) return;
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await doctorService.getSlots(user.id, today);
            setSlots(data);
        } catch (err) {
            console.error('Failed to load slots', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSlots(); }, [user?.id]);

    const handleCreate = async () => {
        if (!user?.id || !formData.slotDate || !formData.startTime || !formData.endTime) {
            toast.error('Please fill all fields');
            return;
        }
        setCreating(true);
        try {
            await doctorService.createSlot({
                doctorId: user.id,
                slotDate: formData.slotDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                consultationType: formData.consultationType
            });
            toast.success('Slot created successfully!');
            setShowDialog(false);
            setFormData({ slotDate: '', startTime: '09:00', endTime: '09:30', consultationType: 'video' });
            fetchSlots();
        } catch (err: any) {
            toast.error(err.message || 'Failed to create slot');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (slotId: string) => {
        try {
            await doctorService.deleteSlot(slotId);
            toast.success('Slot deleted');
            fetchSlots();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete slot');
        }
    };

    // Group slots by date
    const groupedSlots: Record<string, DoctorSlot[]> = {};
    slots.forEach(s => {
        if (!groupedSlots[s.slotDate]) groupedSlots[s.slotDate] = [];
        groupedSlots[s.slotDate].push(s);
    });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-purple-600" /></div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Manage Slots</h1>
                    <p className="text-slate-500 mt-1">Create and manage your availability</p>
                </div>
                <Button onClick={() => setShowDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Slot
                </Button>
            </div>

            {/* Slot List grouped by date */}
            {Object.keys(groupedSlots).length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700">No upcoming slots</h3>
                        <p className="text-slate-500 mt-1">Create a slot to start receiving appointments</p>
                    </CardContent>
                </Card>
            ) : (
                Object.entries(groupedSlots).map(([date, dateSlots]) => (
                    <Card key={date}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {dateSlots.map(slot => (
                                <div key={slot.slotId} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {slot.startTime} - {slot.endTime}
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {slot.consultationType === 'video' ? (
                                                <><Video className="w-3 h-3 mr-1 text-blue-500" /> Video</>
                                            ) : (
                                                <><Building2 className="w-3 h-3 mr-1 text-amber-500" /> Hospital</>
                                            )}
                                        </Badge>
                                        {slot.isBooked && (
                                            <Badge className="bg-green-100 text-green-700 text-xs">Booked</Badge>
                                        )}
                                    </div>
                                    {!slot.isBooked && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(slot.slotId)}>
                                            <Trash2 className="w-4 h-4 text-rose-500" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Create Slot Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Slot</DialogTitle>
                        <DialogDescription>Add a new available time slot for patients to book.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={formData.slotDate}
                                onChange={e => setFormData({ ...formData, slotDate: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Consultation Type</Label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFormData({ ...formData, consultationType: 'video' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.consultationType === 'video'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <Video className="w-5 h-5" />
                                    Video Call
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, consultationType: 'hospital' })}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.consultationType === 'hospital'
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    <Building2 className="w-5 h-5" />
                                    Hospital
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleCreate} disabled={creating}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create Slot
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
