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
    <div ref={containerRef} className="space-y-8 p-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-item">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name || 'Lab Partner'}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening in your lab today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <Activity className="w-4 h-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-item">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-xl", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-medium border-0">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity - Placeholder for real data integration later if needed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-item">
        {/* Recent Bookings (Visual Only for now, data in BookingManagement) */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Bookings</CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
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
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-slate-50 border-slate-200">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">Add Test</div>
                <div className="text-xs text-slate-500">Create new test listing</div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto p-4 hover:bg-slate-50 border-slate-200">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-900">Manage Staff</div>
                <div className="text-xs text-slate-500">Add technicians</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
