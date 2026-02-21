import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'teal' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
  className?: string;
  onClick?: () => void;
}

const colorVariants = {
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    border: 'border-teal-200',
    gradient: 'from-teal-500 to-teal-600'
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-200',
    gradient: 'from-indigo-500 to-indigo-600'
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-200',
    gradient: 'from-amber-500 to-amber-600'
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    border: 'border-rose-200',
    gradient: 'from-rose-500 to-rose-600'
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    border: 'border-sky-200',
    gradient: 'from-sky-500 to-sky-600'
  }
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'teal',
  className,
  onClick
}: StatCardProps) {
  const colors = colorVariants[color];

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-slate-200 transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center',
          colors.bg
        )}>
          <Icon className={cn('w-4 h-4 sm:w-6 sm:h-6', colors.icon)} />
        </div>

        {trend && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            trend.isPositive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          )}>
            {trend.isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="mt-2 sm:mt-4">
        <h3 className="text-slate-500 text-xs sm:text-sm font-medium">{title}</h3>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 mt-0.5 sm:mt-1">{value}</p>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Mini stat card for compact layouts
interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'teal' | 'indigo' | 'emerald' | 'amber';
}

export function MiniStatCard({ label, value, icon: Icon, color = 'teal' }: MiniStatCardProps) {
  const colors = colorVariants[color];

  return (
    <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-200">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
        <Icon className={cn('w-5 h-5', colors.icon)} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
