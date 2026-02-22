import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FlaskConical, Calendar, FileText,
  History, Users, Building2, ClipboardCheck, BarChart3,
  Settings, ChevronRight, Beaker, Clock, Stethoscope,
  IndianRupee, Landmark
} from 'lucide-react';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  role: UserRole;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

const patientNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { label: 'Browse Tests', icon: FlaskConical, href: '#tests' },
  { label: 'Book Test', icon: Calendar, href: '#book' },
  { label: 'My Appointments', icon: ClipboardCheck, href: '#appointments' },
  { label: 'Reports', icon: FileText, href: '#reports' },
  { label: 'Consult Doctor', icon: Stethoscope, href: '#doctors' },
  { label: 'Doctor Appts', icon: Calendar, href: '#doctor-appointments' },
  { label: 'Test History', icon: History, href: '#history' },
];

const labNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { label: 'Manage Tests', icon: FlaskConical, href: '#tests' },
  { label: 'Manage Schedule', icon: Clock, href: '#schedule' },
  { label: 'Technicians', icon: Users, href: '#technicians' }, // New Item
  { label: 'Bookings', icon: Calendar, href: '#bookings', badge: 12 },
  { label: 'Sample Workflow', icon: Beaker, href: '#workflow' },
  { label: 'Upload Reports', icon: FileText, href: '#upload' },
  { label: 'Performance', icon: BarChart3, href: '#performance' },
  { label: 'Settings', icon: Settings, href: '#settings' },
];

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { label: 'Users', icon: Users, href: '#users' },
  { label: 'Labs', icon: Building2, href: '#labs', badge: 3 },
  { label: 'Doctors', icon: Users, href: '#doctors' },
  { label: 'Bookings', icon: Calendar, href: '#bookings' },
  { label: 'Payouts', icon: Landmark, href: '#payouts' },
  { label: 'Settings', icon: Settings, href: '#settings' },
];

const doctorNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { label: 'Manage Slots', icon: Clock, href: '#slots' },
  { label: 'Appointments', icon: Calendar, href: '#appointments' },
  { label: 'Earnings', icon: IndianRupee, href: '#earnings' },
  { label: 'My Patients', icon: Users, href: '#patients' },
];

const technicianNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { label: 'My Requests', icon: ClipboardCheck, href: '#requests' },
  { label: 'History', icon: History, href: '#history' },
];

const navItemsByRole: Record<UserRole, NavItem[]> = {
  patient: patientNavItems,
  lab: labNavItems,
  admin: adminNavItems,
  doctor: doctorNavItems,
  technician: technicianNavItems,
};

const roleColors: Record<UserRole, { bg: string; text: string; active: string }> = {
  patient: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    active: 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
  },
  lab: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    active: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
  },
  admin: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    active: 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
  },
  doctor: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    active: 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
  },
  technician: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    active: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
  }
};

export function Sidebar({ role, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [activeItem, setActiveItem] = useState(window.location.hash || '#dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sync activeItem with URL hash on mount and hash changes
  useEffect(() => {
    const syncHash = () => {
      setActiveItem(window.location.hash || '#dashboard');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  // Normalize role to ensure it matches keys (e.g. 'PATIENT' -> 'patient')
  const normalizedRole = (role?.toLowerCase() || 'patient') as UserRole;

  const navItems = navItemsByRole[normalizedRole] || navItemsByRole.patient;
  const colors = roleColors[normalizedRole] || roleColors.patient;

  const handleItemClick = (href: string) => {
    setActiveItem(href);
    window.location.hash = href;
    if (onMobileClose) onMobileClose();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 ease-clinical z-40",
        // Mobile behavior: Hidden by default, block if isMobileOpen
        !isMobileOpen && "hidden lg:block",
        // Desktop behavior: Always visible (lg:block logic handled above, but ensure width is correct)
        isMobileOpen ? "w-64" : (isCollapsed ? "w-20" : "w-64")
      )}
    >
      {/* Collapse Toggle - Desktop Only */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border border-slate-200 rounded-full hidden lg:flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        <ChevronRight className={cn(
          "w-4 h-4 text-slate-400 transition-transform",
          !isCollapsed && "rotate-180"
        )} />
      </button>

      <div className="p-4 h-full overflow-y-auto custom-scrollbar">
        {/* Role Badge */}
        <div className={cn(
          "mb-6 px-4 py-2 rounded-xl text-sm font-medium text-center transition-all",
          colors.bg, colors.text,
          (isCollapsed && !isMobileOpen) && "px-2 text-xs"
        )}>
          {isCollapsed && !isMobileOpen ? normalizedRole.charAt(0).toUpperCase() : `${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)} Portal`}
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.href;

            // Force Expanded on Mobile
            const showLabel = isMobileOpen || !isCollapsed;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => handleItemClick(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? colors.active
                    : "hover:bg-slate-100 text-slate-600",
                  (!showLabel) && "justify-center px-2"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700"
                )} />

                {showLabel && (
                  <>
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 bg-rose-500 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom Section */}
        {(isMobileOpen || !isCollapsed) && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                  <FlaskConical className={cn("w-5 h-5", colors.text)} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-800">Need Help?</p>
                  <p className="text-xs text-slate-500">Contact support</p>
                </div>
              </div>
              <button className={cn(
                "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                colors.bg, colors.text, "hover:opacity-80"
              )}>
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
