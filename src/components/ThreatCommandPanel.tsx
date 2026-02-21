import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { useBreach } from '../App';

interface ThreatEvent {
  id: string;
  type: 'blocked' | 'detected' | 'neutralized';
  source: string;
  target: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function ThreatCommandPanel() {
  const { isSystemUnderAttack } = useBreach();
  const [phase, setPhase] = useState<'observe' | 'analyze' | 'act'>('observe');
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState({
    blocked: 847291,
    detected: 1247,
    neutralized: 1243,
    responseTime: 12,
  });

  // Cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'observe') return 'analyze';
        if (prev === 'analyze') return 'act';
        return 'observe';
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Generate threat events
  useEffect(() => {
    const threats: ThreatEvent[] = [
      { id: '1', type: 'blocked', source: '192.168.1.45', target: 'Web Server', timestamp: new Date(), severity: 'medium' },
      { id: '2', type: 'neutralized', source: '10.0.0.23', target: 'Database', timestamp: new Date(Date.now() - 30000), severity: 'high' },
      { id: '3', type: 'detected', source: '172.16.0.5', target: 'API Gateway', timestamp: new Date(Date.now() - 60000), severity: 'low' },
      { id: '4', type: 'blocked', source: '192.168.2.78', target: 'Mail Server', timestamp: new Date(Date.now() - 90000), severity: 'critical' },
    ];
    setEvents(threats);

    const interval = setInterval(() => {
      const types: ('blocked' | 'detected' | 'neutralized')[] = ['blocked', 'detected', 'neutralized'];
      const severities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
      
      const newEvent: ThreatEvent = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        source: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        target: ['Web Server', 'Database', 'API Gateway', 'Mail Server'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
        severity: severities[Math.floor(Math.random() * severities.length)],
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 4)]);
      
      // Update stats
      setStats(prev => ({
        blocked: prev.blocked + (newEvent.type === 'blocked' ? 1 : 0),
        detected: prev.detected + 1,
        neutralized: prev.neutralized + (newEvent.type === 'neutralized' ? 1 : 0),
        responseTime: Math.max(8, prev.responseTime + Math.floor(Math.random() * 5) - 2),
      }));
    }, 3500);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blocked': return <Shield className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />;
      case 'neutralized': return <CheckCircle className="w-4 h-4 text-[#00F5FF]" strokeWidth={1.5} />;
      case 'detected': return <AlertTriangle className="w-4 h-4 text-yellow-500" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Phase Indicator - Observe-Analyze-Act */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[rgba(0,0,0,0.3)]">
        {(['observe', 'analyze', 'act'] as const).map((p, i) => (
          <div key={p} className="flex-1 flex items-center gap-2">
            <motion.div
              animate={{
                backgroundColor: phase === p ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: phase === p ? 'rgba(0, 245, 255, 0.5)' : 'transparent',
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border"
            >
              <div className={`w-2 h-2 rounded-full ${phase === p ? 'bg-[#00F5FF] animate-pulse' : 'bg-[#A7B0C8]/50'}`} />
              <span className={`font-micro text-[10px] tracking-widest uppercase ${
                phase === p ? 'text-[#00F5FF]' : 'text-[#A7B0C8]'
              }`}>
                {p}
              </span>
            </motion.div>
            {i < 2 && <div className="w-4 h-px bg-[rgba(0,245,255,0.2)]" />}
          </div>
        ))}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div 
          className="glass-panel-sm p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />
            <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Blocked</span>
          </div>
          <span className="font-mono text-2xl font-semibold text-[#00FF94]">
            {stats.blocked.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-[#00FF94]" />
            <span className="font-mono text-[10px] text-[#00FF94]">+2.4%</span>
          </div>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#00F5FF]" strokeWidth={1.5} />
            <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Detected</span>
          </div>
          <span className="font-mono text-2xl font-semibold text-[#00F5FF]">
            {stats.detected.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono text-[10px] text-[#A7B0C8]">Today</span>
          </div>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
            <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Neutralized</span>
          </div>
          <span className="font-mono text-2xl font-semibold text-[#8B5CF6]">
            {stats.neutralized.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono text-[10px] text-[#8B5CF6]">99.7% success</span>
          </div>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#F5F7FF]" strokeWidth={1.5} />
            <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Response</span>
          </div>
          <span className="font-mono text-2xl font-semibold text-[#F5F7FF]">
            {stats.responseTime}
          </span>
          <span className="font-mono text-sm text-[#A7B0C8]">ms</span>
        </motion.div>
      </div>

      {/* Live Threat Feed */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[10px] text-[#A7B0C8] tracking-widest uppercase">
            Live Threat Feed
          </span>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
        </div>
        
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-2 rounded-lg bg-[rgba(0,0,0,0.2)] hover:bg-[rgba(0,0,0,0.3)] transition-colors"
              >
                {getTypeIcon(event.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#F5F7FF]">{event.source}</span>
                    <span className="text-[#A7B0C8]">→</span>
                    <span className="font-mono text-[11px] text-[#A7B0C8] truncate">{event.target}</span>
                  </div>
                </div>
                <span className={`font-micro text-[9px] uppercase ${getSeverityColor(event.severity)}`}>
                  {event.severity}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
