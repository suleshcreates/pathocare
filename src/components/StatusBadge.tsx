import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, FlaskConical, FileCheck, UserCheck, Loader2, CreditCard
} from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<BookingStatus, {
  label: string;
  icon: any;
  colors: string;
}> = {
  'REQUESTED': {
    label: 'Request Sent',
    icon: Loader2,
    colors: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  },
  'REJECTED': {
    label: 'Rejected',
    icon: CheckCircle2,
    colors: 'bg-red-100 text-red-700 border-red-200'
  },
  'PAYMENT_PENDING': {
    label: 'Payment Pending',
    icon: CreditCard,
    colors: 'bg-orange-100 text-orange-700 border-orange-200'
  },
  'BOOKED': {
    label: 'Booked',
    icon: CheckCircle2,
    colors: 'bg-sky-100 text-sky-700 border-sky-200'
  },
  'TECH_ASSIGNED': {
    label: 'Technician Assigned',
    icon: UserCheck,
    colors: 'bg-violet-100 text-violet-700 border-violet-200'
  },
  'SAMPLE_COLLECTED': {
    label: 'Sample Collected',
    icon: FlaskConical,
    colors: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  'TESTING': {
    label: 'Testing in Progress',
    icon: Loader2,
    colors: 'bg-indigo-100 text-indigo-700 border-indigo-200'
  },
  'REPORT_READY': {
    label: 'Report Ready',
    icon: FileCheck,
    colors: 'bg-teal-100 text-teal-700 border-teal-200'
  }
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2'
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
};

export function StatusBadge({ status, showIcon = true, size = 'md' }: StatusBadgeProps) {
  // Try exact match or uppercase match
  const standardizedStatus = (status?.toUpperCase() as BookingStatus) || 'BOOKED';
  const config = statusConfig[standardizedStatus] || {
    label: status || 'Unknown',
    icon: FlaskConical,
    colors: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full border transition-all duration-200',
      config.colors,
      sizeClasses[size]
    )}>
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          standardizedStatus === 'TESTING' && 'animate-spin'
        )} />
      )}
      {config.label}
    </span>
  );
}

// Timeline component for status progression
interface StatusTimelineProps {
  currentStatus: BookingStatus;
  className?: string;
}

const timelineSteps: BookingStatus[] = [
  'BOOKED',
  'TECH_ASSIGNED',
  'SAMPLE_COLLECTED',
  'TESTING',
  'REPORT_READY'
];

export function StatusTimeline({ currentStatus, className }: StatusTimelineProps) {
  const currentIndex = timelineSteps.indexOf(currentStatus?.toUpperCase() as BookingStatus);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (timelineSteps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        {timelineSteps.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const config = statusConfig[step];
          const Icon = config.icon;

          return (
            <div
              key={step}
              className={cn(
                'relative z-10 flex flex-col items-center gap-2',
                isCurrent && 'scale-110'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                isCompleted
                  ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-white border-slate-300 text-slate-400',
                isCurrent && 'ring-4 ring-teal-500/20 animate-pulse'
              )}>
                <Icon className={cn('w-5 h-5', isCurrent && 'animate-spin')} />
              </div>
              <span className={cn(
                'text-xs font-medium whitespace-nowrap',
                isCompleted ? 'text-slate-700' : 'text-slate-400'
              )}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
