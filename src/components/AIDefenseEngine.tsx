import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Layers, Target, Sparkles } from 'lucide-react';
import { useBreach } from '../App';

interface ModelStatus {
  name: string;
  accuracy: number;
  latency: number;
  status: 'active' | 'training' | 'updating';
}

export function AIDefenseEngine() {
  const { isSystemUnderAttack } = useBreach();
  const [phase, setPhase] = useState<'observe' | 'analyze' | 'act'>('observe');
  const [models] = useState<ModelStatus[]>([
    { name: 'Behavioral', accuracy: 98.7, latency: 8, status: 'active' },
    { name: 'Anomaly', accuracy: 97.2, latency: 12, status: 'active' },
    { name: 'Threat Intel', accuracy: 99.1, latency: 15, status: 'active' },
  ]);
  const [neuralActivity, setNeuralActivity] = useState(0);

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

  // Simulate neural activity
  useEffect(() => {
    const interval = setInterval(() => {
      setNeuralActivity(prev => {
        const target = isSystemUnderAttack ? 85 + Math.random() * 15 : 40 + Math.random() * 30;
        return prev + (target - prev) * 0.3;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSystemUnderAttack]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Neural Activity Visualizer */}
      <div className="relative h-24 rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
        {/* Neural Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="neuralGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill={isSystemUnderAttack ? '#FF2E63' : '#00F5FF'} />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#neuralGrid)" />
          </svg>
        </div>

        {/* Animated Nodes */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-3 h-3 rounded-full ${
                isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'
              }`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + Math.sin(i) * 20}%`,
              }}
            />
          ))}
        </div>

        {/* Activity Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[rgba(255,255,255,0.1)]">
          <motion.div
            className={`h-full ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'}`}
            animate={{ width: `${neuralActivity}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Activity Label */}
        <div className="absolute top-2 left-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Neural Activity
          </span>
          <span className={`font-mono text-lg font-semibold ml-2 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`}>
            {neuralActivity.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-2">
        {(['observe', 'analyze', 'act'] as const).map((p) => (
          <motion.div
            key={p}
            animate={{
              backgroundColor: phase === p ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg"
          >
            {p === 'observe' && <Brain className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'analyze' && <Cpu className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'act' && <Zap className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            <span className={`font-micro text-[9px] tracking-widest uppercase ${
              phase === p ? 'text-[#8B5CF6]' : 'text-[#A7B0C8]'
            }`}>
              {p}
            </span>
          </motion.div>
        ))}
      </div>

      {/* AI Models */}
      <div className="space-y-2">
        <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
          Active Models
        </span>
        {models.map((model, i) => (
          <motion.div
            key={model.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3 h-3 text-[#8B5CF6]" strokeWidth={1.5} />
              <span className="font-mono text-[11px] text-[#F5F7FF]">{model.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />
                <span className="font-mono text-[10px] text-[#00FF94]">{model.accuracy}%</span>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full ${
                model.status === 'active' ? 'bg-[#00FF94]' : 'bg-yellow-500'
              }`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Model Update Status */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
        <Sparkles className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
        <div>
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block">
            Model Updates
          </span>
          <span className="font-mono text-xs text-[#8B5CF6]">Real-time</span>
        </div>
      </div>
    </div>
  );
}
