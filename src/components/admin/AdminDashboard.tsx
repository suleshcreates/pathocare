import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Users, Building2, Calendar,
  DollarSign, Activity, CheckCircle2, Clock,
  AlertCircle, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/adminService';
import type { DashboardStats, Lab, Booking } from '@/types';
import { cn } from '@/lib/utils';

export function AdminDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingLabs, setPendingLabs] = useState<Lab[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]); // We might need to implement this in service too
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, labsData] = await Promise.all([
          adminService.getStats(),
          adminService.getLabs('PENDING')
        ]);
        setStats(statsData);
        setPendingLabs(labsData);
       
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Welcome Section */}
      <div className="animate-item bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-amber-100 text-sm font-medium">Admin Control Panel</p>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">System Overview</h1>
              <p className="text-amber-100 mt-2">
                Monitor platform performance, manage users, and oversee all operations.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                <Activity className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-item">
          <StatCard
            title="Total Users"
            value={(stats?.totalUsers || 0).toLocaleString()}
            subtitle="Registered accounts"
            icon={Users}
            color="amber"
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Total Labs"
            value={stats?.totalLabs || 0}
            subtitle="Registered labs"
            icon={Building2}
            color="indigo"
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Total Bookings"
            value={(stats?.totalBookings || 0).toLocaleString()}
            subtitle="All time bookings"
            icon={Calendar}
            color="teal"
          />
        </div>
        <div className="animate-item">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats?.revenue || 0)}
            subtitle="Total earnings"
            icon={DollarSign}
            color="emerald"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="animate-item">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Labs awaiting approval</p>
              </div>
              {pendingLabs.length > 0 && (
                <Badge className="bg-rose-100 text-rose-700">
                  {pendingLabs.length} pending
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{lab.name}</h4>
                        <p className="text-sm text-slate-500">{lab.address}</p>
                        {/* Accreditation badge removed as mock data was rich, real data might lack this initially */}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {/* Simple approve button for quick action, or link to LabApproval page */}
                      <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => adminService.approveLab(lab.id).then(() => setPendingLabs(prev => prev.filter(l => l.id !== lab.id)))}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}

                {pendingLabs.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-slate-500">All labs approved!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings (Placeholder / Static for now as we focused on Labs) */}
        <div className="animate-item lg:col-span-2">
          {/* ... Keeping existing Recent Bookings logic, or we can hide it if no data ... 
              For now, let's keep it but it might be empty if we didn't fetch it. 
              Ideally we should fetch it. Let's comment out or render empty state if not fetched.
          */}
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Latest platform activity</p>
              </div>
              {/* ... */}
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                Feature coming soon (Live Feed)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health Section Preserved as Generic Mock for Visuals */}
      {/* ... */}
    </div>
  );
}
