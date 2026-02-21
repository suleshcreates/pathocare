import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { labService } from '@/services/labService';
import { useAuth } from '@/context/AuthContext';
// import { cn } from '@/lib/utils';

export function ManageSchedule() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Test Selection
    const [tests, setTests] = useState<any[]>([]);
    const [selectedTestId, setSelectedTestId] = useState<string>('');

    // New Slot Form
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [capacity, setCapacity] = useState('5');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        const loadTests = async () => {
            try {
                const data = await labService.getTests();
                setTests(data || []);
            } catch (e) {
                console.error(e);
                toast.error("Failed to load tests");
            }
        };
        loadTests();
    }, []);

    useEffect(() => {
        if (selectedTestId) {
            fetchSlots();
        } else {
            setSlots([]);
        }
    }, [selectedDate, selectedTestId, user?.id]);

    const fetchSlots = useCallback(async () => {
        if (!user?.id || !selectedTestId) return;

        const controller = new AbortController();
        const signal = controller.signal;

        try {
            setLoading(true);
            // Pass signal to labService (requires updating service, but for now we just handle partial cleanup)
            // Ideally we update labService to accept signal, but let's just avoid state updates if unmounted/changed.

            const data = await labService.getSlots(user.id, selectedTestId, selectedDate);
            if (!signal.aborted) {
                setSlots(data || []);
            }
        } catch (error) {
            if (!signal.aborted) {
                console.error("Fetch slots error:", error);
                toast.error("Failed to load time slots");
            }
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }

        return () => controller.abort();
    }, [user?.id, selectedTestId, selectedDate]);

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        if (selectedTestId) {
            fetchSlots().then((fn) => { cleanup = fn; });
        } else {
            setSlots([]);
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, [fetchSlots, selectedTestId]);

    const handleAddSlot = async () => {
        if (!startTime || !endTime || !capacity) {
            toast.error("Please fill all fields");
            return;
        }

        // Basic validation
        if (startTime >= endTime) {
            toast.error(`Start time (${startTime}) must be before end time (${endTime}). For PM hours, use 13:00, 14:00, etc.`);
            return;
        }

        setAdding(true);
        try {
            const timeSlotString = `${startTime} - ${endTime}`;
            // Check duplicate
            const exists = slots.some(s => s.time_slot === timeSlotString);
            if (exists) {
                toast.error("This time slot already exists");
                return;
            }

            await labService.addSlot({
                lab_id: user?.id,
                test_id: selectedTestId,
                slot_date: selectedDate,
                time_slot: timeSlotString,
                max_capacity: parseInt(capacity)
            });

            toast.success("Slot added successfully");
            fetchSlots();
            // Reset defaults but keep date
            setStartTime('');
            setEndTime('');
        } catch (error) {
            console.error("Add slot error details:", error);
            if (error instanceof Error) {
                toast.error(`Failed: ${error.message}`);
            } else {
                toast.error("Failed to add slot: Unknown error");
            }
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteSlot = async (slotId: string) => {
        try {
            await labService.deleteSlot(slotId);
            toast.success("Slot removed");
            setSlots(slots.filter(s => s.slot_id !== slotId));
        } catch (error) {
            console.error("Delete slot error:", error);
            toast.error("Failed to delete slot");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manage Schedule</h1>
                <p className="text-slate-500">Define availability and capacity for your lab.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Test & Date Selection */}
                <div className="space-y-6 lg:col-span-1">
                    {/* Test Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-teal-600" />
                                Select Test
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading && tests.length === 0 ? (
                                <p className="text-sm text-slate-500">Loading tests...</p>
                            ) : tests.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-500 mb-2">No tests found.</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.location.hash = '#tests'}
                                        className="w-full"
                                    >
                                        Create a Test
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={selectedTestId}
                                        onChange={(e) => setSelectedTestId(e.target.value)}
                                    >
                                        <option value="">-- Select a Test --</option>
                                        {tests.map((t) => (
                                            <option key={t.test_id} value={t.test_id}>
                                                {t.test_name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2">
                                        You must select a test to manage its schedule.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Date Selection */}
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5 text-teal-600" />
                                Select Date
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full"
                            />
                            <p className="text-sm text-slate-500 mt-4">
                                Managing slots for: <br />
                                <span className="font-semibold text-slate-800">
                                    {new Date(selectedDate).toDateString()}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Slots Management */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedTestId ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <Clock className="w-12 h-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700">No Test Selected</h3>
                            <p className="text-slate-500">Please select a test from the left to view and manage slots.</p>
                        </div>
                    ) : (
                        <>
                            {/* Add Slot Form */}
                            <Card className="bg-slate-50 border-dashed border-teal-200">
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="space-y-2 flex-1">
                                            <Label>Start Time</Label>
                                            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label>End Time</Label>
                                            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                        </div>
                                        <div className="space-y-2 w-24">
                                            <Label>Capacity</Label>
                                            <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                                        </div>
                                        <Button onClick={handleAddSlot} disabled={adding} className="bg-teal-600 hover:bg-teal-700">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Slots List */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-700">Available Slots</h3>
                                {loading ? (
                                    <div className="text-center py-8 text-slate-500">Loading slots...</div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center py-12 border rounded-xl bg-white border-dashed">
                                        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">No slots defined for this date.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {slots.map((slot) => (
                                            <div key={slot.slot_id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-teal-300 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                                                        <Clock className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{slot.time_slot}</p>
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                            <Users className="w-3 h-3" />
                                                            Max Capacity: {slot.max_capacity}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                    onClick={() => handleDeleteSlot(slot.slot_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
