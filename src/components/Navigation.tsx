import { useState, useEffect } from 'react';
import {
  Bell, Menu, X, ChevronDown, FlaskConical, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
// import { notifications } from '@/data/mockData';
import type { UserRole, Notification } from '@/types';

interface NavigationProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function Navigation({ isMobileMenuOpen, onToggleMobileMenu }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { role, user, logout } = useAuth();
  const [notifications] = useState<Notification[]>([]); // Empty for now

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleColors: Record<UserRole, string> = {
    patient: 'bg-teal-100 text-teal-700',
    lab: 'bg-indigo-100 text-indigo-700',
    admin: 'bg-amber-100 text-amber-700',
    doctor: 'bg-purple-100 text-purple-700',
    technician: 'bg-orange-100 text-orange-700'
  };

  const roleLabels: Record<UserRole, string> = {
    patient: 'Patient',
    lab: 'Lab Staff',
    admin: 'Administrator',
    doctor: 'Doctor',
    technician: 'Technician'
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-clinical ${isScrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-lg py-2 sm:py-3'
        : 'bg-white py-2.5 sm:py-4'
        }`}
    >
      <div className="px-4 lg:px-8 max-w-full">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={onToggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold gradient-text">PathoCare</h1>
                <p className="text-xs text-slate-500 -mt-1">Diagnostic Platform</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Role Switcher (Demo Only) */}
            {/* Role Switcher Removed - User Role is determined by Auth */}
            {user && role && (
              <div
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${roleColors[role]} border-current/20`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span className="text-sm font-medium">{roleLabels[role]}</span>
              </div>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  <span className="text-xs text-slate-500">{unreadCount} unread</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.slice(0, 4).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-3">
                    <div className="flex items-center gap-2 w-full">
                      <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' :
                        notification.type === 'warning' ? 'bg-amber-500' :
                          notification.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
                        }`} />
                      <span className="font-medium text-sm">{notification.title}</span>
                      {!notification.read && (
                        <span className="ml-auto w-2 h-2 bg-teal-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-4">{notification.message}</p>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-teal-400 to-indigo-400 flex items-center justify-center text-white font-semibold text-sm">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        user.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <ChevronDown className="hidden lg:block w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-rose-600" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
