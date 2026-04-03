import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import {
  Calendar, Activity, IndianRupee, Clock,
  TrendingUp, Users, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { labService } from '@/services/labService';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LabDashboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedTests: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const data = await labService.getStats(user.id);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch lab stats:", error);
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.animate-item'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [loading]);

  const dashboardStats = [
    {
      label: 'Today\'s Bookings',
      value: stats.pendingBookings.toString(), // Using pending as proxy for "active/today" workflow
      subtext: 'Pending actions',
      icon: Calendar,
      color: 'bg-blue-100 text-blue-600',
      trend: '+12%'
    },
    {
      label: 'Tests Completed',
      value: stats.completedTests.toString(),
      subtext: 'This Month',
      icon: Activity,
      color: 'bg-emerald-100 text-emerald-600',
      trend: '+8%'
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      subtext: 'This Month',
      icon: IndianRupee,
      color: 'bg-amber-100 text-amber-600',
      trend: '+24%'
    },
    {
      label: 'Pending Reports',
      value: stats.pendingBookings.toString(), // Simplify for now
      subtext: 'Action required',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600',
      trend: '-5%'
    }
  ];

  return (
    <div ref={containerRef} className="space-y-6 stagger-children">
      {/* Welcome Section */}
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative flex flex-col justify-center border border-slate-800 shadow-sleek">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 w-full">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
              Welcome back, {user?.name || 'Lab Partner'}
            </h1>
            <p className="text-slate-300 mt-2 max-w-md text-sm sm:text-base hidden sm:block">Here's an overview of what's happening in your lab today.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-transparent border border-slate-700 text-slate-200 px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString()}
            </div>
            <Button className="bg-white text-slate-900 hover:bg-slate-200 text-sm transition-colors gap-2">
              <Activity className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="card-sleek border-0">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl border border-slate-100", stat.color.replace('bg-', 'bg-').replace('100', '50'))}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{stat.value}</h3>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{stat.subtext}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity - Placeholder for real data integration later if needed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings (Visual Only for now, data in BookingManagement) */}
        <Card className="lg:col-span-2 card-sleek border-0">
          <CardHeader className="border-b border-slate-100 bg-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              <div className="p-8 text-center text-slate-500">
                Check "Bookings" tab for detailed list
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Center */}
        <Card className="card-sleek border-0">
          <CardHeader className="border-b border-slate-100 bg-white rounded-t-2xl">
            <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start h-auto p-4 transition-all hover:border-blue-200 hover:shadow-sm border-slate-200 group">
              <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg mr-3 group-hover:bg-blue-100 transition-colors">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">Add Test</div>
                <div className="text-xs text-slate-500 mt-0.5">Create new test listing</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 transition-all hover:border-purple-200 hover:shadow-sm border-slate-200 group">
              <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg mr-3 group-hover:bg-purple-100 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">Manage Staff</div>
                <div className="text-xs text-slate-500 mt-0.5">Add technicians</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
