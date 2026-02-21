import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { ArrowUp, ArrowDown, Activity, Globe, Server } from 'lucide-react';
import { useBreach } from '../App';

interface TrafficData {
  time: number;
  inbound: number;
  outbound: number;
  anomalous: number;
}

export function NetworkMonitor() {
  const { isSystemUnderAttack } = useBreach();
  const [data, setData] = useState<TrafficData[]>([]);
  const [stats, setStats] = useState({
    inboundMbps: 1247,
    outboundMbps: 892,
    packetsPerSec: 45231,
    activeConnections: 1247,
  });

  // Generate traffic data
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const now = Date.now();
        const isAttack = isSystemUnderAttack;
        
        const newPoint: TrafficData = {
          time: now,
          inbound: isAttack ? 800 + Math.random() * 400 : 200 + Math.random() * 150,
          outbound: isAttack ? 600 + Math.random() * 300 : 150 + Math.random() * 100,
          anomalous: isAttack ? 300 + Math.random() * 200 : 20 + Math.random() * 30,
        };
        
        return [...prev.slice(-30), newPoint];
      });

      setStats(prev => ({
        inboundMbps: prev.inboundMbps + Math.floor(Math.random() * 100) - 50,
        outboundMbps: prev.outboundMbps + Math.floor(Math.random() * 80) - 40,
        packetsPerSec: prev.packetsPerSec + Math.floor(Math.random() * 1000) - 500,
        activeConnections: prev.activeConnections + Math.floor(Math.random() * 20) - 10,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isSystemUnderAttack]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Traffic Stats */}
      <div className="grid grid-cols-2 gap-2">
        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDown className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Inbound</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#00F5FF]">
            {(stats.inboundMbps / 1000).toFixed(2)}
          </span>
          <span className="font-mono text-xs text-[#A7B0C8]"> Gbps</span>
        </motion.div>

        <motion.div 
          className="glass-panel-sm p-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUp className="w-3 h-3 text-[#8B5CF6]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Outbound</span>
          </div>
          <span className="font-mono text-lg font-semibold text-[#8B5CF6]">
            {(stats.outboundMbps / 1000).toFixed(2)}
          </span>
          <span className="font-mono text-xs text-[#A7B0C8]"> Gbps</span>
        </motion.div>
      </div>

      {/* Traffic Chart */}
      <div className="flex-1 min-h-[100px]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Live Traffic
          </span>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
            isSystemUnderAttack ? 'bg-[#FF2E63]/20' : 'bg-[#00FF94]/20'
          }`}>
            <Activity className={`w-3 h-3 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`} strokeWidth={1.5} />
            <span className={`font-micro text-[8px] uppercase ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`}>
              {isSystemUnderAttack ? 'Anomaly Detected' : 'Normal'}
            </span>
          </div>
        </div>

        <div className="h-[80px] rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 'auto']} />
              <Line
                type="monotone"
                dataKey="inbound"
                stroke="#00F5FF"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="outbound"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              {isSystemUnderAttack && (
                <Line
                  type="monotone"
                  dataKey="anomalous"
                  stroke="#FF2E63"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  strokeDasharray="4 4"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connection Stats */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-[#A7B0C8]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Connections</span>
        </div>
        <span className="font-mono text-sm text-[#F5F7FF]">{stats.activeConnections.toLocaleString()}</span>
      </div>

      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#A7B0C8]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Packets/sec</span>
        </div>
        <span className="font-mono text-sm text-[#F5F7FF]">{stats.packetsPerSec.toLocaleString()}</span>
      </div>
    </div>
  );
}
