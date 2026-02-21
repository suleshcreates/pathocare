import { useState } from 'react';
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  Settings, 
  Shield,
  Zap,
  Lock,
  Cloud,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertOctagon,
  Fingerprint,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreach } from '../App';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  status?: 'secure' | 'warning' | 'danger';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Threat Command', icon: LayoutDashboard, status: 'secure' },
  { id: 'globe', label: 'Attack Surface', icon: Globe, badge: 3 },
  { id: 'phishing', label: 'Phishing Shield', icon: Shield, status: 'secure' },
  { id: 'ransomware', label: 'Ransomware Guard', icon: AlertOctagon, badge: 1 },
  { id: 'identity', label: 'Identity Shield', icon: Fingerprint, status: 'secure' },
  { id: 'cloud', label: 'Cloud Fabric', icon: Cloud },
  { id: 'network', label: 'Network Monitor', icon: Network, badge: 12 },
  { id: 'ai-engine', label: 'AI Defense Engine', icon: Zap, status: 'secure' },
  { id: 'soc', label: 'SOC Center', icon: Users, badge: 5 },
  { id: 'access', label: 'Access Control', icon: Lock },
  { id: 'reports', label: 'Intelligence', icon: FileText },
  { id: 'settings', label: 'System Settings', icon: Settings },
];

interface NeuralSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function NeuralSidebar({ collapsed, onToggle }: NeuralSidebarProps) {
  const [activeItem, setActiveItem] = useState('dashboard');
  const { isSystemUnderAttack } = useBreach();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'secure': return 'text-[#00FF94]';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-[#FF2E63]';
      default: return 'text-[#A7B0C8]';
    }
  };

  const getGlowColor = (status?: string) => {
    switch (status) {
      case 'secure': return 'shadow-[#00FF94]/30';
      case 'warning': return 'shadow-yellow-500/30';
      case 'danger': return 'shadow-[#FF2E63]/30';
      default: return 'shadow-[#00F5FF]/30';
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Glass Background */}
      <div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-xl border-r border-[rgba(0,245,255,0.08)]" />

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-4 z-50 w-6 h-6 rounded-full bg-[#0A0A0C] border border-[rgba(0,245,255,0.3)] flex items-center justify-center hover:border-[rgba(0,245,255,0.6)] transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
        ) : (
          <ChevronLeft className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
        )}
      </button>

      {/* Navigation Content */}
      <nav className="relative h-full flex flex-col py-4 overflow-hidden">
        {/* Section Label */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <span className="font-micro text-[10px] text-[#A7B0C8] tracking-[0.2em] uppercase">
              Defense Modules
            </span>
          </div>
        )}

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? `bg-gradient-to-r from-[rgba(0,245,255,0.15)] to-transparent border border-[rgba(0,245,255,0.25)]` 
                    : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
                } ${isSystemUnderAttack && isActive ? 'border-[rgba(255,46,99,0.4)]' : ''}`}
                whileTap={{ scale: 0.98 }}
              >
                {/* Active Glow Effect */}
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className={`absolute inset-0 rounded-xl ${getGlowColor(item.status)}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10">
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive 
                        ? isSystemUnderAttack ? 'text-[#FF2E63]' : getStatusColor(item.status)
                        : 'text-[#A7B0C8] group-hover:text-[#F5F7FF]'
                    }`} 
                  />
                </div>

                {/* Label */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className={`relative z-10 text-sm font-medium transition-colors duration-200 ${
                        isActive 
                          ? isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#F5F7FF]'
                          : 'text-[#A7B0C8] group-hover:text-[#F5F7FF]'
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Badge */}
                {!collapsed && item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`relative z-10 ml-auto font-mono text-[10px] px-2 py-0.5 rounded-full ${
                      item.badge > 5 
                        ? 'bg-[#FF2E63]/20 text-[#FF2E63]' 
                        : 'bg-[#00F5FF]/20 text-[#00F5FF]'
                    }`}
                  >
                    {item.badge}
                  </motion.span>
                )}

                {/* Status Indicator */}
                {!collapsed && item.status && (
                  <div className={`relative z-10 ml-auto w-2 h-2 rounded-full ${
                    item.status === 'secure' ? 'bg-[#00FF94]' : 
                    item.status === 'warning' ? 'bg-yellow-500' : 'bg-[#FF2E63]'
                  }`} />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom Status */}
        {!collapsed && (
          <div className="mt-auto px-4 pt-4 border-t border-[rgba(0,245,255,0.08)]">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isSystemUnderAttack ? 'bg-[#FF2E63]/20' : 'bg-[#00FF94]/20'
              }`}>
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'
                }`} />
              </div>
              <div>
                <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block">
                  System Status
                </span>
                <span className={`font-mono text-xs font-semibold ${
                  isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00FF94]'
                }`}>
                  {isSystemUnderAttack ? 'BREACH DETECTED' : 'SECURE'}
                </span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
