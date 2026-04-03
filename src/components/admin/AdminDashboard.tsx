import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  Users, Building2, Calendar,
  DollarSign, CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/adminService';
import type { DashboardStats, Lab } from '@/types';
export function AdminDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingLabs, setPendingLabs] = useState<Lab[]>([]);

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div ref={containerRef} className="space-y-6 stagger-children">
      {/* Welcome Section */}
      <div className="bg-slate-900 rounded-3xl p-6 lg:p-8 text-white relative flex flex-col justify-center border border-slate-800 shadow-sleek">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">Admin Control Panel</p>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1 tracking-tight">System Overview</h1>
              <p className="text-slate-300 mt-2">
                Monitor platform performance, manage users, and oversee all operations.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-transparent border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white backdrop-blur-sm transition-colors"
                onClick={() => window.location.hash = '#users'}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button
                className="bg-white text-slate-900 hover:bg-slate-200 transition-colors"
                onClick={() => window.location.hash = '#labs'}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Manage Labs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <StatCard
            title="Total Users"
            value={(stats?.totalUsers || 0).toLocaleString()}
            subtitle="Registered accounts"
            icon={Users}
            color="amber"
          />
        </div>
        <div>
          <StatCard
            title="Total Labs"
            value={stats?.totalLabs || 0}
            subtitle="Registered labs"
            icon={Building2}
            color="indigo"
          />
        </div>
        <div>
          <StatCard
            title="Total Bookings"
            value={(stats?.totalBookings || 0).toLocaleString()}
            subtitle="All time bookings"
            icon={Calendar}
            color="teal"
          />
        </div>
        <div>
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
        <div>
          <Card className="h-full card-sleek border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white rounded-t-2xl">
              <div>
                <CardTitle className="text-lg">Pending Approvals</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Labs awaiting approval</p>
              </div>
              {pendingLabs.length > 0 && (
                <Badge className="bg-rose-50 border border-rose-200/50 text-rose-700">
                  {pendingLabs.length} pending
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {pendingLabs.map((lab) => (
                  <div
                    key={lab.id}
                    className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800">{lab.name}</h4>
                        <p className="text-sm text-slate-500">{lab.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 bg-slate-800 hover:bg-slate-900 text-white" onClick={() => adminService.approveLab(lab.id).then(() => setPendingLabs(prev => prev.filter(l => l.id !== lab.id)))}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}

                {pendingLabs.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <p className="text-slate-500 font-medium">All labs approved!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card className="h-full card-sleek border-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-white rounded-t-2xl">
              <div>
                <CardTitle className="text-lg">Platform Activity</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Recent system-wide events</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500 uppercase tracking-wide text-sm font-medium">
                Live Feed Module Initializing...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
