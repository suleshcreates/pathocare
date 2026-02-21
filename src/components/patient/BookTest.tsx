import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, MapPin, Home,
  AlertCircle, Building2, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { testService } from '@/services/testService';
import { bookingService } from '@/services/bookingService';
import { labService } from '@/services/labService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types';
import { BrowseTests } from './BrowseTests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Predefined Time Slots removed in favor of dynamic slots

export function BookTest() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const labId = searchParams.get('labId');
  const testId = searchParams.get('testId');

  const [test, setTest] = useState<LabTest | null>(null);
  const [labTests, setLabTests] = useState<any[]>([]); // List of tests for this lab
  const [loading, setLoading] = useState(false); // Global loading
  const [submitting, setSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'success'>('idle');

  // Form State
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [collectionType, setCollectionType] = useState<'home' | 'lab'>('home');
  const [address, setAddress] = useState('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);

  // Real Slots
  const [availableSlots, setAvailableSlots] = useState<{ slot_id: string, time_slot: string, is_available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Pre-fill user address
  useEffect(() => {
    if (user?.address) {
      setAddress(user.address);
    }
  }, [user]);

  // 1. Fetch Tests for this Lab (if labId is present)
  useEffect(() => {
    const fetchLabTests = async () => {
      if (!labId || labId === 'undefined') return; // Guard against "undefined" string
      try {
        const tests = await testService.getTestsByLab(labId);
        setLabTests(tests || []);
      } catch (error) {
        console.error("Failed to fetch lab tests:", error);
      }
    };
    fetchLabTests();
  }, [labId]);

  // 2. Fetch Selected Test Details
  useEffect(() => {
    const fetchDetails = async () => {
      if (!testId) {
        setTest(null);
        return;
      }
      try {
        setLoading(true);
        const data = await testService.getTestById(testId);
        setTest(data);

        // Auto-set Lab ID if missing from URL
        if (!labId && data.labId) {
          setSearchParams({ testId, labId: data.labId });
        }
      } catch (error) {
        console.error("Failed to fetch test:", error);
        toast.error("Failed to load test details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [testId, labId, setSearchParams]);

  // 3. Fetch Slots when Date Changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!labId || !date || !testId) return;
      try {
        setSlotsLoading(true);
        const slots = await labService.getAvailableSlots(labId, testId, date);
        setAvailableSlots(slots || []);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        toast.error("Failed to load available slots");
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [labId, date, testId]);

  // Handle Test Selection
  const handleTestSelect = (newTestId: string) => {
    setSearchParams({ labId: labId!, testId: newTestId });
    // Reset form
    setDate('');
    setTimeSlot('');
    setAvailableSlots([]);
  };

  const handleSubmit = async () => {
    if (!user || !test || !labId) return;
    if (!date || !timeSlot) {
      toast.error("Please select date and time");
      return;
    }
    if (collectionType === 'home') {
      setShowAddressDialog(true);
      return;
    }

    // Proceed directly for lab visit
    await confirmBooking();
  };

  const confirmBooking = async () => {
    if (collectionType === 'home' && !address) {
      toast.error("Please enter collection address");
      return;
    }

    setSubmitting(true);
    setShowAddressDialog(false);
    try {
      await bookingService.createBooking({
        patientId: user!.id,
        labId: labId,
        testId: test!.id,
        appointmentDate: date,
        appointmentTime: timeSlot,
        collectionType,
        address: collectionType === 'home' ? address : 'Lab Visit'
      });

      toast.success("Booking request sent successfully!");
      setBookingStatus('success');

      setTimeout(() => {
        navigate('/dashboard#appointments');
      }, 3000);
    } catch (error: any) {
      console.error("Booking failed:", error);
      if (error.message?.includes('fully booked')) {
        toast.error('This lab is fully booked for the selected date.');
      } else {
        toast.error("Failed to create booking request");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingStatus === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Booking Request Sent!</h3>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Your booking request has been sent to <strong>{test?.name || 'the lab'}</strong>.
          You will be notified once they accept your request.
        </p>
        <Button onClick={() => navigate('/dashboard#appointments')}>
          View My Bookings
        </Button>
      </div>
    );
  }

  if (!labId || labId === 'null' || labId === 'undefined') {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800">Start Booking</h3>
            <p className="text-sm text-blue-600">Please select a test to proceed with your booking.</p>
          </div>
        </div>
        <BrowseTests />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
        <p className="text-slate-500">Complete your booking details</p>
      </div>

      {/* Test Selection Dropdown (Always visible or only if no test selected? Let's make it always visible so they can switch) */}
      {!testId && (
        <Card className="border-teal-200 bg-teal-50">
          <CardHeader>
            <CardTitle className="text-teal-800">Select a Test</CardTitle>
          </CardHeader>
          <CardContent>
            {labTests.length === 0 ? (
              <p className="text-slate-500">Loading tests or no tests available...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {labTests.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleTestSelect(t.id)}
                    className="cursor-pointer p-4 bg-white rounded-lg border border-teal-100 hover:border-teal-500 hover:shadow-md transition-all"
                  >
                    <h4 className="font-semibold text-slate-800">{t.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">₹{t.price}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {testId && (
        <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg">
          <div>
            <span className="text-slate-500 text-sm">Selected Test:</span>
            <p className="font-bold text-slate-800">{test?.name || 'Loading...'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSearchParams({ labId: labId! })}>Change Test</Button>
        </div>
      )}

      {testId && test && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT COLUMN: FORM */}
          <div className="md:col-span-2 space-y-6">

            {/* 1. Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Available Slots</Label>
                  {slotsLoading ? (
                    <div className="text-sm text-slate-500">Loading slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      {date ? "No slots available for this date." : "Please select a date first."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.slot_id}
                          onClick={() => slot.is_available && setTimeSlot(slot.time_slot)}
                          disabled={!slot.is_available}
                          className={cn(
                            "px-2 py-2 text-sm rounded-lg border transition-all relative",
                            timeSlot === slot.time_slot
                              ? "bg-slate-900 text-white border-slate-900 shadow-md"
                              : slot.is_available
                                ? "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                          )}
                        >
                          {slot.time_slot}
                          {!slot.is_available && (
                            <span className="block text-[10px] text-red-500 font-medium">Full</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Collection Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Collection Preference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup value={collectionType} onValueChange={(v: 'home' | 'lab') => setCollectionType(v)} className="grid grid-cols-2 gap-4">
                  <div className={cn("p-4 border rounded-xl cursor-pointer transition-all", collectionType === 'home' ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 hover:border-slate-300")}>
                    <RadioGroupItem value="home" id="home" className="sr-only" />
                    <Label htmlFor="home" className="cursor-pointer flex flex-col items-center gap-2">
                      <Home className={cn("w-6 h-6", collectionType === 'home' ? "text-emerald-600" : "text-slate-400")} />
                      <span className="font-semibold">Home Collection</span>
                    </Label>
                  </div>
                  <div className={cn("p-4 border rounded-xl cursor-pointer transition-all", collectionType === 'lab' ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" : "border-slate-200 hover:border-slate-300")}>
                    <RadioGroupItem value="lab" id="lab" className="sr-only" />
                    <Label htmlFor="lab" className="cursor-pointer flex flex-col items-center gap-2">
                      <Building2 className={cn("w-6 h-6", collectionType === 'lab' ? "text-emerald-600" : "text-slate-400")} />
                      <span className="font-semibold">Lab Visit</span>
                    </Label>
                  </div>
                </RadioGroup>

                {collectionType === 'home' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label>Address</Label>
                    <Input
                      placeholder="Enter full address for sample collection"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="space-y-6">
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="py-4 text-center text-slate-500">Loading details...</div>
                ) : test ? (
                  <>
                    <div>
                      <div className="text-sm text-slate-500">Test Name</div>
                      <div className="font-semibold text-slate-900">{test.name}</div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Test Price</span>
                      <span className="font-bold text-slate-900">₹{test.price}</span>
                    </div>
                    {collectionType === 'home' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Home Collection Fee</span>
                        <span className="font-medium text-slate-900">
                          {test.homeVisitCharge ? `₹${test.homeVisitCharge}` : '₹0 (Free)'}
                        </span>
                      </div>
                    )}
                    <Separator className="bg-slate-300" />
                    <div className="flex justify-between items-center text-lg font-bold text-emerald-700">
                      <span>Total</span>
                      <span>₹{test.price + (collectionType === 'home' ? (test.homeVisitCharge || 0) : 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-red-500">Test not found</div>
                )}

                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                  onClick={handleSubmit}
                  disabled={submitting || loading || !test}
                >
                  {submitting ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  You will receive a confirmation once the lab assigns a technician. Payment can be made at the time of collection.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      )}

      {/* Address Confirmation Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Home Collection Address</DialogTitle>
            <DialogDescription>
              Please verify the address where the technician should come to collect the sample.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="address" className="text-sm font-medium">Collection Address</Label>
              {user?.address && (
                <button
                  onClick={() => setAddress(user.address || '')}
                  className="text-xs text-emerald-600 font-medium hover:underline focus:outline-none"
                >
                  Use Default Address
                </button>
              )}
            </div>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-2"
              placeholder="Enter your complete address"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>Cancel</Button>
            <Button onClick={confirmBooking} disabled={!address || submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? 'Confirming...' : 'Confirm & Book'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
