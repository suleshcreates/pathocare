import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  Search, FlaskConical,
  Beaker, Microscope, Stethoscope, Package, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { testService } from '@/services/testService';
import type { LabTest, TestCategory } from '@/types';
import { cn } from '@/lib/utils';

const categories: { id: TestCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All', icon: FlaskConical },
  { id: 'blood', label: 'Blood', icon: Beaker },
  { id: 'urine', label: 'Urine', icon: Microscope },
  { id: 'imaging', label: 'Imaging', icon: Stethoscope },
  { id: 'health-package', label: 'Packages', icon: Package },
];

export function BrowseTests() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'all'>('all');
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await testService.getTests();
        setTests(data as any[]);
      } catch (error) {
        console.error('Failed to fetch tests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (containerRef.current && !loading) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.test-card'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power3.out' }
      );
    }
  }, [selectedCategory, searchQuery, loading]);

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const testCategory = (test.category || '').toLowerCase();
    const matchesCategory = selectedCategory === 'all' || testCategory === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getCategoryImage = (category: TestCategory) => {
    switch (category) {
      case 'blood': return '/category-blood.jpg';
      case 'urine': return '/category-urine.jpg';
      case 'imaging': return '/category-imaging.jpg';
      case 'health-package': return '/category-health.jpg';
      default: return '/category-blood.jpg';
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col min-h-0">
      {/* ── Sticky Header: Search + Filters ── */}
      <div className="sticky top-0 z-20 bg-slate-50 pb-3 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:-mx-8 lg:px-8 pt-1">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Browse Tests</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Verified labs near you</p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-500 hidden sm:flex">
            {filteredTests.length} tests
          </Badge>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tests, labs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-slate-200 shadow-sm focus:shadow-md transition-shadow text-sm"
          />
        </div>

        {/* Category pills – horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all duration-200 flex-shrink-0',
                  isActive
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-teal-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Test Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-1">
        {filteredTests.map((test) => {
          return (
            <div
              key={test.id}
              className="test-card bg-white rounded-[1.25rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Top: Image Thumbnail */}
              <div className="w-full aspect-[16/9] sm:aspect-[2/1] bg-slate-100 relative group overflow-hidden border-b border-slate-100">
                <img
                  src={(test as any).image || (test as any).image_url || getCategoryImage(test.category)}
                  alt={test.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getCategoryImage(test.category);
                  }}
                />
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 text-lg sm:text-xl leading-snug">
                  {test.name}
                </h3>
                
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {(test.description || `${test.name} offered by ${(test as any).labName || 'Verified Lab'} online lab test`)}
                </p>

                {/* Flexible spacer */}
                <div className="flex-1" />

                {/* Time + Price row */}
                <div className="flex items-baseline justify-between mt-4 mb-4">
                  <span className="text-2xl font-black text-slate-800 tracking-tight">₹{test.price}</span>
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>{(test as any).labName || 'Verified Lab'}</span>
                    <span>{test.turnaroundTime}</span>
                  </div>
                </div>

                {/* Book Now Button */}
                <Button
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl h-11 text-[15px] font-bold shadow-md shadow-teal-500/20"
                  onClick={() => {
                    window.location.href = `/dashboard?testId=${test.id}&labId=${test.labId}#book`;
                  }}
                >
                  Book Now
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTests.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">No tests found</h3>
          <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 rounded-xl"
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 mt-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-[72px] h-[72px] rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button – My Appointments */}
      <button
        onClick={() => { window.location.hash = 'appointments'; }}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl shadow-xl shadow-teal-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform lg:hidden"
        title="My Appointments"
      >
        <Calendar className="w-6 h-6" />
      </button>
    </div>
  );
}
