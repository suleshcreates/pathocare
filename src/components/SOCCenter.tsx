import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Headphones, MessageSquare, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { useBreach } from '../App';

interface Analyst {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'away';
  ticketsHandled: number;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  assigned?: string;
}

export function SOCCenter() {
  const { isSystemUnderAttack } = useBreach();
  const [analysts] = useState<Analyst[]>([
    { id: '1', name: 'Sarah Chen', role: 'L1 Analyst', status: 'online', ticketsHandled: 47 },
    { id: '2', name: 'Mike Ross', role: 'L2 Analyst', status: 'busy', ticketsHandled: 32 },
    { id: '3', name: 'Alex Kim', role: 'Threat Hunter', status: 'online', ticketsHandled: 28 },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({
    alertsTriaged: 12400,
    avgResponseTime: 4,
    satisfaction: 98,
  });

  // Generate alerts
  useEffect(() => {
    const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    const messages = [
      'Suspicious login attempt',
      'Malware detected',
      'Unusual data transfer',
      'Policy violation',
      'Failed authentication',
    ];

    const interval = setInterval(() => {
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const newAlert: Alert = {
        id: Date.now().toString(),
        severity,
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 3)]);
      
      setStats(prev => ({
        ...prev,
        alertsTriaged: prev.alertsTriaged + 1,
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-[#FF2E63]';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-[#00F5FF]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-[#00FF94]';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-[#A7B0C8]';
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* SOC Stats */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div 
          className="glass-panel-sm p-2 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-[#00F5FF]" strokeWidth={1.5} />
          <span className="font-mono text-sm font-semibold text-[#00F5FF]">
            {(stats.alertsTriaged / 1000).toFixed(1)}K
          </span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">/hr</span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <Clock className="w-4 h-4 mx-auto mb-1 text-[#8B5CF6]" strokeWidth={1.5} />
          <span className="font-mono text-sm font-semibold text-[#8B5CF6]">{stats.avgResponseTime}</span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">min avg</span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <Headphones className="w-4 h-4 mx-auto mb-1 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-mono text-sm font-semibold text-[#00FF94]">{stats.satisfaction}%</span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">CSAT</span>
        </motion.div>
      </div>

      {/* Active Analysts */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Active Analysts
          </span>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />
            <span className="font-mono text-xs text-[#F5F7FF]">{analysts.length}</span>
          </div>
        </div>

        <div className="space-y-2">
          {analysts.map((analyst) => (
            <motion.div
              key={analyst.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00F5FF] to-[#8B5CF6] flex items-center justify-center">
                    <span className="font-mono text-[10px] text-white">{analyst.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0C] ${getStatusColor(analyst.status)}`} />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#F5F7FF]">{analyst.name}</p>
                  <p className="font-micro text-[8px] text-[#A7B0C8]">{analyst.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-[#00FF94]">{analyst.ticketsHandled}</p>
                <p className="font-micro text-[8px] text-[#A7B0C8]">tickets</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Alerts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Live Alerts
          </span>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
        </div>

        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 p-1.5 rounded bg-[rgba(0,0,0,0.2)]"
              >
                <AlertCircle className={`w-3 h-3 ${getSeverityColor(alert.severity)}`} strokeWidth={1.5} />
                <span className="flex-1 font-mono text-[9px] text-[#F5F7FF] truncate">{alert.message}</span>
                <span className={`font-micro text-[8px] uppercase ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 p-2 rounded-lg bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.2)] hover:bg-[rgba(0,245,255,0.15)] transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-[#00F5FF]" strokeWidth={1.5} />
        <span className="font-micro text-[10px] text-[#00F5FF] tracking-widest uppercase">Chat with SOC</span>
      </motion.button>
    </div>
  );
}
