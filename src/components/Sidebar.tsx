import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FlaskConical, Calendar, FileText,
  History, Users, Building2, ClipboardCheck, BarChart3,
  Settings, ChevronRight, Beaker, Clock, Stethoscope,
  IndianRupee, Landmark, Mail, Phone, MessageCircle, X
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
    active: 'bg-teal-600 text-white shadow-sleek'
  },
  lab: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    active: 'bg-indigo-600 text-white shadow-sleek'
  },
  admin: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    active: 'bg-slate-800 text-white shadow-sleek'
  },
  doctor: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    active: 'bg-sky-600 text-white shadow-sleek'
  },
  technician: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    active: 'bg-rose-600 text-white shadow-sleek'
  }
};

export function Sidebar({ role, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [activeItem, setActiveItem] = useState(window.location.hash || '#dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

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
    <>
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
              <button
                onClick={() => setShowSupport(true)}
                className={cn(
                  "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                  colors.bg, colors.text, "hover:opacity-80"
                )}
              >
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>

    {/* Support Dialog */}
    {showSupport && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSupport(false)}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-indigo-600 px-6 py-5 text-white relative">
            <button onClick={() => setShowSupport(false)} className="absolute top-4 right-4 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Get Support</h3>
                <p className="text-teal-100 text-sm">We're here to help 24/7</p>
              </div>
            </div>
          </div>

          {/* Contact Options */}
          <div className="p-6 space-y-3">
            <a
              href="mailto:support@pathocare.com"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                <Mail className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Email Support</p>
                <p className="text-xs text-slate-500">support@pathocare.com</p>
              </div>
            </a>

            <a
              href="tel:+911800123456"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Phone className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Call Us</p>
                <p className="text-xs text-slate-500">1800-123-456 (Toll Free)</p>
              </div>
            </a>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">WhatsApp</p>
                <p className="text-xs text-slate-500">Chat with us instantly</p>
              </div>
            </a>

            <div className="pt-3 text-center">
              <p className="text-xs text-slate-400">Available Mon–Sat, 8 AM – 10 PM IST</p>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

