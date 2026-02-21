import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Lock, Unlock, RotateCcw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useBreach } from '../App';

interface ResponseAction {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
  duration: number;
}

export function ResponseProtocols() {
  const { isSystemUnderAttack } = useBreach();
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [stats] = useState({
    autoRemediated: 99.4,
    avgResponseTime: 12,
    isolationCount: 3,
  });

  // Generate response actions
  useEffect(() => {
    const actionNames = [
      'Isolate Endpoint',
      'Block IP Range',
      'Disable Account',
      'Quarantine File',
      'Revoke Session',
    ];

    const interval = setInterval(() => {
      const statuses: ('pending' | 'executing' | 'completed' | 'failed')[] = ['pending', 'executing', 'completed'];
      const newAction: ResponseAction = {
        id: Date.now().toString(),
        name: actionNames[Math.floor(Math.random() * actionNames.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        timestamp: new Date(),
        duration: Math.floor(Math.random() * 500) + 100,
      };

      setActions(prev => [newAction, ...prev.slice(0, 2)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />;
      case 'executing': return <Zap className="w-3 h-3 text-[#00F5FF] animate-pulse" strokeWidth={1.5} />;
      case 'failed': return <AlertTriangle className="w-3 h-3 text-[#FF2E63]" strokeWidth={1.5} />;
      default: return <Clock className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-[#00FF94]';
      case 'executing': return 'text-[#00F5FF]';
      case 'failed': return 'text-[#FF2E63]';
      default: return 'text-[#A7B0C8]';
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Auto-Remediation Rate */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,255,148,0.1)] border border-[rgba(0,255,148,0.2)]">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Auto-Remediated</span>
        </div>
        <span className="font-mono text-xl font-semibold text-[#00FF94]">{stats.autoRemediated}%</span>
      </div>

      {/* Response Stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Response</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#00F5FF]">{stats.avgResponseTime}</span>
          <span className="font-mono text-xs text-[#A7B0C8]"> ms</span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="w-3 h-3 text-[#FF2E63]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Isolated</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#FF2E63]">{stats.isolationCount}</span>
        </motion.div>
      </div>

      {/* Recent Actions */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Recent Actions
          </span>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
        </div>

        <div className="space-y-2">
          {actions.map((action) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(action.status)}
                <span className="font-mono text-[10px] text-[#F5F7FF]">{action.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-micro text-[8px] uppercase ${getStatusColor(action.status)}`}>
                  {action.status}
                </span>
                {action.status === 'completed' && (
                  <span className="font-mono text-[9px] text-[#A7B0C8]">{action.duration}ms</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[rgba(255,46,99,0.1)] border border-[rgba(255,46,99,0.2)] hover:bg-[rgba(255,46,99,0.15)] transition-colors"
        >
          <Lock className="w-3 h-3 text-[#FF2E63]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#FF2E63] tracking-widest uppercase">Isolate All</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[rgba(0,255,148,0.1)] border border-[rgba(0,255,148,0.2)] hover:bg-[rgba(0,255,148,0.15)] transition-colors"
        >
          <Unlock className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#00FF94] tracking-widest uppercase">Restore</span>
        </motion.button>
      </div>
    </div>
  );
}
