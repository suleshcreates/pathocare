import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Shield, Lock, Eye, CheckCircle, Clock } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  compliance: number;
  lastAudit: Date;
  status: 'compliant' | 'pending' | 'non-compliant';
}

export function CompliancePosture() {
  const [frameworks] = useState<Framework[]>([
    { id: '1', name: 'SOC 2', compliance: 98, lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'compliant' },
    { id: '2', name: 'ISO 27001', compliance: 96, lastAudit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: 'compliant' },
    { id: '3', name: 'GDPR', compliance: 99, lastAudit: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), status: 'compliant' },
  ]);
  const [stats, setStats] = useState({
    overallScore: 98,
    evidenceCollected: 1247,
    pendingAudits: 2,
  });

  // Simulate compliance updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        overallScore: Math.min(100, Math.max(95, prev.overallScore + Math.floor(Math.random() * 3) - 1)),
        evidenceCollected: prev.evidenceCollected + Math.floor(Math.random() * 5),
        pendingAudits: Math.max(0, prev.pendingAudits + Math.floor(Math.random() * 3) - 1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'non-compliant': return 'text-[#FF2E63]';
      case 'pending': return 'text-yellow-500';
      default: return 'text-[#00FF94]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'non-compliant': return 'bg-[#FF2E63]/20';
      case 'pending': return 'bg-yellow-500/20';
      default: return 'bg-[#00FF94]/20';
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Overall Compliance Score */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,255,148,0.1)] border border-[rgba(0,255,148,0.2)]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Compliance Score</span>
        </div>
        <span className="font-mono text-xl font-semibold text-[#00FF94]">{stats.overallScore}%</span>
      </div>

      {/* Frameworks */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Frameworks
          </span>
        </div>

        <div className="space-y-2">
          {frameworks.map((framework) => (
            <motion.div
              key={framework.id}
              className="p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] text-[#F5F7FF]">{framework.name}</span>
                </div>
                <div className={`px-1.5 py-0.5 rounded ${getStatusBg(framework.status)}`}>
                  <span className={`font-micro text-[8px] uppercase ${getStatusColor(framework.status)}`}>
                    {framework.status}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#00FF94] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${framework.compliance}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[#00FF94]">{framework.compliance}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-[#8B5CF6]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Evidence</span>
          </div>
          <span className="font-mono text-sm text-[#8B5CF6]">{stats.evidenceCollected}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />
            <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Pending</span>
          </div>
          <span className={`font-mono text-sm ${stats.pendingAudits > 0 ? 'text-yellow-500' : 'text-[#00FF94]'}`}>
            {stats.pendingAudits}
          </span>
        </div>
      </div>

      {/* Controls Status */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <div className="flex-1 flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase">Controls</span>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <CheckCircle key={i} className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />
          ))}
        </div>
      </div>
    </div>
  );
}
