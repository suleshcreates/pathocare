import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { Lock, Unlock, FileKey, AlertOctagon, CheckCircle } from 'lucide-react';
import { useBreach } from '../App';

interface EntropyData {
  time: number;
  entropy: number;
  baseline: number;
}

export function RansomwareGuard() {
  const { isSystemUnderAttack } = useBreach();
  const [data, setData] = useState<EntropyData[]>([]);
  const [isHighDisorder, setIsHighDisorder] = useState(false);
  const [protectedFiles, setProtectedFiles] = useState(12473);
  const [quarantined, setQuarantined] = useState(0);
  const [phase, setPhase] = useState<'observe' | 'analyze' | 'act'>('observe');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate entropy data
  useEffect(() => {
    const generateData = () => {
      const now = Date.now();
      const newData: EntropyData[] = [];
      
      for (let i = 50; i >= 0; i--) {
        const time = now - i * 1000;
        const isAttack = isSystemUnderAttack && i < 15;
        const baseline = 4.5;
        
        let entropy: number;
        if (isAttack) {
          // High disorder - jagged, high entropy
          entropy = baseline + Math.random() * 3 + Math.sin(i * 0.5) * 1.5;
        } else {
          // Normal - smooth, low entropy
          entropy = baseline + Math.random() * 0.8 + Math.sin(i * 0.2) * 0.3;
        }
        
        newData.push({
          time,
          entropy: Math.min(8, Math.max(2, entropy)),
          baseline,
        });
      }
      
      setData(newData);
      setIsHighDisorder(isSystemUnderAttack);
    };

    generateData();
    
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const isAttack = isSystemUnderAttack;
        const baseline = 4.5;
        
        let entropy: number;
        if (isAttack) {
          entropy = baseline + Math.random() * 3 + Math.sin(Date.now() * 0.01) * 1.5;
        } else {
          entropy = baseline + Math.random() * 0.8;
        }
        
        const newPoint = {
          time: Date.now(),
          entropy: Math.min(8, Math.max(2, entropy)),
          baseline,
        };
        
        return [...prev.slice(1), newPoint];
      });
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSystemUnderAttack]);

  // Cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'observe') return 'analyze';
        if (prev === 'analyze') return 'act';
        return 'observe';
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Update stats
  useEffect(() => {
    const interval = setInterval(() => {
      setProtectedFiles(prev => prev + Math.floor(Math.random() * 10));
      if (isSystemUnderAttack) {
        setQuarantined(prev => prev + Math.floor(Math.random() * 3));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isSystemUnderAttack]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Phase Indicator */}
      <div className="flex items-center gap-2">
        {(['observe', 'analyze', 'act'] as const).map((p) => (
          <motion.div
            key={p}
            animate={{
              backgroundColor: phase === p 
                ? isHighDisorder ? 'rgba(255, 46, 99, 0.2)' : 'rgba(0, 245, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.05)',
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg"
          >
            {p === 'observe' && <AlertOctagon className="w-3 h-3" strokeWidth={1.5} />}
            {p === 'analyze' && <FileKey className="w-3 h-3" strokeWidth={1.5} />}
            {p === 'act' && isHighDisorder ? <Lock className="w-3 h-3" strokeWidth={1.5} /> : <Unlock className="w-3 h-3" strokeWidth={1.5} />}
            <span className={`font-micro text-[9px] tracking-widest uppercase ${
              phase === p ? (isHighDisorder ? 'text-[#FF2E63]' : 'text-[#00F5FF]') : 'text-[#A7B0C8]'
            }`}>
              {p}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Entropy Graph */}
      <div className="flex-1 min-h-[120px]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            File Entropy Monitor
          </span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
            isHighDisorder ? 'bg-[#FF2E63]/20' : 'bg-[#00FF94]/20'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isHighDisorder ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
            <span className={`font-micro text-[9px] uppercase ${isHighDisorder ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`}>
              {isHighDisorder ? 'High Disorder' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="h-[100px] rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="entropyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isHighDisorder ? '#FF2E63' : '#00F5FF'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isHighDisorder ? '#FF2E63' : '#00F5FF'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <YAxis domain={[0, 8]} hide />
              <Area
                type={isHighDisorder ? "step" : "monotone"}
                dataKey="entropy"
                stroke={isHighDisorder ? '#FF2E63' : '#00F5FF'}
                strokeWidth={isHighDisorder ? 2 : 1.5}
                fill="url(#entropyGradient)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                strokeWidth={1}
                fill="none"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div 
          className="glass-panel-sm p-2.5"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Protected</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#00FF94]">
            {protectedFiles.toLocaleString()}
          </span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2.5"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-3 h-3 text-[#FF2E63]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Quarantined</span>
          </div>
          <span className={`font-mono text-lg font-semibold ${quarantined > 0 ? 'text-[#FF2E63]' : 'text-[#A7B0C8]'}`}>
            {quarantined}
          </span>
        </motion.div>
      </div>

      {/* Confidence Score */}
      <div className="flex items-center gap-3 p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={isHighDisorder ? '#FF2E63' : '#00FF94'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="125.6"
              animate={{
                strokeDashoffset: isHighDisorder ? 25 : 12.5,
              }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono text-[10px] font-semibold ${isHighDisorder ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`}>
              {isHighDisorder ? '80' : '90'}%
            </span>
          </div>
        </div>
        <div>
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block">
            Detection Confidence
          </span>
          <span className={`text-xs ${isHighDisorder ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`}>
            {isHighDisorder ? 'Encryption Detected' : 'System Secure'}
          </span>
        </div>
      </div>
    </div>
  );
}
