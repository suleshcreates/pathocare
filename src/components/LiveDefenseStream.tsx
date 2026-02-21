import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Scan, Shield, Zap, Activity, Target } from 'lucide-react';
import { useBreach } from '../App';

interface Detection {
  id: string;
  type: string;
  confidence: number;
  action: string;
  timestamp: Date;
}

export function LiveDefenseStream() {
  const { isSystemUnderAttack } = useBreach();
  const [phase, setPhase] = useState<'observe' | 'analyze' | 'act'>('observe');
  const [detections, setDetections] = useState<Detection[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [stats, setStats] = useState({
    detectionLatency: 8,
    packetsAnalyzed: 45231000,
    threatsDetected: 1247,
  });

  // Cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'observe') return 'analyze';
        if (prev === 'analyze') return 'act';
        return 'observe';
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Scan progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress(prev => (prev + 1) % 100);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Generate detections
  useEffect(() => {
    const types = ['SQL Injection', 'XSS Attempt', 'DDoS Pattern', 'Brute Force', 'Malware Signature'];
    const actions = ['Blocked', 'Quarantined', 'Flagged', 'Neutralized'];

    const interval = setInterval(() => {
      const newDetection: Detection = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        confidence: 85 + Math.floor(Math.random() * 15),
        action: actions[Math.floor(Math.random() * actions.length)],
        timestamp: new Date(),
      };

      setDetections(prev => [newDetection, ...prev.slice(0, 2)]);
      
      setStats(prev => ({
        packetsAnalyzed: prev.packetsAnalyzed + Math.floor(Math.random() * 10000),
        threatsDetected: prev.threatsDetected + (Math.random() > 0.7 ? 1 : 0),
        detectionLatency: Math.max(4, prev.detectionLatency + Math.floor(Math.random() * 3) - 1),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Live Scanner Visual */}
      <div className="relative h-24 rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
        {/* Scanning Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full border ${isSystemUnderAttack ? 'border-[#FF2E63]/30' : 'border-[#00F5FF]/30'}`}
              style={{
                width: `${40 + i * 25}%`,
                height: `${40 + i * 25}%`,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        {/* Center Eye */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Eye className={`w-10 h-10 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`} strokeWidth={1} />
          </motion.div>
        </div>

        {/* Scan Progress */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(255,255,255,0.1)]">
          <motion.div
            className={`h-full ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'}`}
            style={{ width: `${scanProgress}%` }}
          />
        </div>

        {/* Scanning Label */}
        <div className="absolute top-2 left-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Deep Packet Inspection
          </span>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-2">
        {(['observe', 'analyze', 'act'] as const).map((p) => (
          <motion.div
            key={p}
            animate={{
              backgroundColor: phase === p ? 'rgba(0, 245, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg"
          >
            {p === 'observe' && <Eye className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'analyze' && <Scan className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'act' && <Zap className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            <span className={`font-micro text-[9px] tracking-widest uppercase ${
              phase === p ? 'text-[#00F5FF]' : 'text-[#A7B0C8]'
            }`}>
              {p}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Detection Stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Latency</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#00F5FF]">{stats.detectionLatency}</span>
          <span className="font-mono text-xs text-[#A7B0C8]"> ms</span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3 h-3 text-[#FF2E63]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Threats</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#FF2E63]">{stats.threatsDetected.toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Recent Detections */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Recent Detections
          </span>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
        </div>

        <div className="space-y-2">
          {detections.map((detection) => (
            <motion.div
              key={detection.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-[#F5F7FF]">{detection.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-[#00FF94]">{detection.confidence}%</span>
                <span className={`font-micro text-[8px] uppercase ${
                  detection.action === 'Blocked' ? 'text-[#FF2E63]' : 'text-[#00F5FF]'
                }`}>
                  {detection.action}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Packets Analyzed */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Packets Analyzed</span>
        <span className="font-mono text-sm text-[#8B5CF6]">{(stats.packetsAnalyzed / 1000000).toFixed(1)}M</span>
      </div>
    </div>
  );
}
