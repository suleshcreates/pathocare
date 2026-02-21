import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import {
  TrendingUp, Users, Calendar, DollarSign,
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/adminService';
import { cn } from '@/lib/utils';

// Simple bar chart component
function SimpleBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  if (!data || data.length === 0) return <div className="text-center text-slate-500 py-4">No data available</div>;

  const maxValue = Math.max(...data.map(d => d.value)) || 1; // Prevent div by zero

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-20">{item.label}</span>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', item.color)}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-700 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// Simple line chart visualization
function SimpleLineChart({ data }: { data: number[] }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500">No data available</div>;

  const maxVal = Math.max(...data) || 100;
  const minVal = Math.min(...data); // Can be 0

  return (
    <div className="h-48 flex items-end gap-1">
      {data.map((point, idx) => (
        <div
          key={idx}
          className="flex-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-sm transition-all hover:from-amber-600 hover:to-amber-400"
          style={{ height: `${point === 0 ? 5 : ((point) / (maxVal)) * 80 + 10}%` }}
          title={`Value: ${point}`}
        />
      ))}
    </div>
  );
}

export function Analytics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 0,
    totalUsers: 0,
    totalBookings: 0,
  });
  const [analyticsData, setAnalyticsData] = useState<{
    monthlyBookings: any[],
    revenueTrend: number[],
    testCategories: any[],
    topLabs: any[]
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [basicStats, analytics] = await Promise.all([
          adminService.getStats(),
          adminService.getAnalytics()
        ]);
        setStats(basicStats);
        setAnalyticsData(analytics);
      } catch (error) {
        console.error("Failed to load analytics:", error);
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

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-amber-500" /></div>;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
        <p className="text-slate-500 mt-1">Platform performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue',
            value: `₹${(stats.revenue).toLocaleString()}`, // Simplified currency
            change: '+--', // Hard to calculate change without historical snapshot
            isPositive: true,
            icon: DollarSign,
            color: 'bg-emerald-100 text-emerald-600'
          },
          {
            label: 'Active Users',
            value: stats.totalUsers.toLocaleString(),
            change: '+--',
            isPositive: true,
            icon: Users,
            color: 'bg-teal-100 text-teal-600'
          },
          {
            label: 'Total Bookings',
            value: stats.totalBookings.toLocaleString(),
            change: '+--',
            isPositive: true,
            icon: Calendar,
            color: 'bg-indigo-100 text-indigo-600'
          },
          {
            label: 'Avg. Turnaround',
            value: '--', // Not yet tracked
            change: '0%',
            isPositive: true,
            icon: Activity,
            color: 'bg-amber-100 text-amber-600'
          },
        ].map((metric) => (
          <Card key={metric.label} className="animate-item">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', metric.color)}>
                  <metric.icon className="w-5 h-5" />
                </div>
                {/* Removed change badge if data is empty/placeholder */}
              </div>
              <p className="text-2xl font-bold text-slate-800">{metric.value}</p>
              <p className="text-xs text-slate-500">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings */}
        <Card className="animate-item">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Monthly Bookings</CardTitle>
              <p className="text-sm text-slate-500">Booking trends over last 6 months</p>
            </div>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={analyticsData?.monthlyBookings || []} />
          </CardContent>
        </Card>

        {/* Test Categories */}
        <Card className="animate-item">
          <CardHeader>
            <CardTitle className="text-lg">Test Categories</CardTitle>
            <p className="text-sm text-slate-500">Distribution by test type</p>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={analyticsData?.testCategories || []} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="animate-item">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <p className="text-sm text-slate-500">Monthly revenue performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-sm text-slate-600">Revenue</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SimpleLineChart data={analyticsData?.revenueTrend || []} />
          <div className="flex justify-between mt-4 text-xs text-slate-400">
            {/* Using labels from monthly bookings (which are last 6 months) */}
            {analyticsData?.monthlyBookings.map(m => (
              <span key={m.label}>{m.label}</span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Labs */}
      <Card className="animate-item">
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Labs</CardTitle>
          <p className="text-sm text-slate-500">Labs with highest booking volumes</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.topLabs.map((lab, idx) => (
              <div key={lab.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                  )}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{lab.name}</p>
                    <p className="text-sm text-slate-500">{lab.bookings.toLocaleString()} bookings</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* Rating placeholder */}
                  {/* <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-700">{lab.rating}</span> */}
                </div>
              </div>
            ))}
            {(!analyticsData?.topLabs || analyticsData.topLabs.length === 0) && (
              <div className="text-center text-slate-500 py-4">No lab data yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keeping Summary Stats static or removing? Let's leave static or minimal for now as we don't have this deep data */}
    </div>
  );
}
