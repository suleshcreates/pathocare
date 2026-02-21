import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Link, FileText, CheckCircle, Shield, Upload } from 'lucide-react';
import { useBreach } from '../App';

interface ScanResult {
  id: string;
  type: 'email' | 'url' | 'attachment';
  name: string;
  threatScore: number;
  status: 'clean' | 'suspicious' | 'malicious';
  timestamp: Date;
}

export function PhishingShield() {
  const { isSystemUnderAttack } = useBreach();
  const [isDragging, setIsDragging] = useState(false);
  const [phase, setPhase] = useState<'observe' | 'analyze' | 'act'>('observe');
  const [results, setResults] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({
    emailsScanned: 45231,
    urlsBlocked: 8921,
    attachmentsCleaned: 1247,
  });

  // Cycle through phases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'observe') return 'analyze';
        if (prev === 'analyze') return 'act';
        return 'observe';
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Generate scan results
  useEffect(() => {
    const sampleResults: ScanResult[] = [
      { id: '1', type: 'email', name: 'invoice@unknown.com', threatScore: 85, status: 'malicious', timestamp: new Date() },
      { id: '2', type: 'url', name: 'secure-bank-update.xyz', threatScore: 92, status: 'malicious', timestamp: new Date(Date.now() - 60000) },
      { id: '3', type: 'attachment', name: 'document.pdf.exe', threatScore: 98, status: 'malicious', timestamp: new Date(Date.now() - 120000) },
    ];
    setResults(sampleResults);

    const interval = setInterval(() => {
      const types: ('email' | 'url' | 'attachment')[] = ['email', 'url', 'attachment'];
      const statuses: ('clean' | 'suspicious' | 'malicious')[] = ['clean', 'suspicious', 'malicious'];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const newResult: ScanResult = {
        id: Date.now().toString(),
        type,
        name: type === 'email' ? `user${Math.floor(Math.random() * 100)}@domain.com` :
              type === 'url' ? `suspicious-link-${Math.floor(Math.random() * 1000)}.com` :
              `file${Math.floor(Math.random() * 100)}.exe`,
        threatScore: status === 'malicious' ? 80 + Math.floor(Math.random() * 20) :
                     status === 'suspicious' ? 40 + Math.floor(Math.random() * 30) :
                     Math.floor(Math.random() * 20),
        status,
        timestamp: new Date(),
      };

      setResults(prev => [newResult, ...prev.slice(0, 2)]);
      
      setStats(prev => ({
        emailsScanned: prev.emailsScanned + (type === 'email' ? 1 : 0),
        urlsBlocked: prev.urlsBlocked + (type === 'url' && status === 'malicious' ? 1 : 0),
        attachmentsCleaned: prev.attachmentsCleaned + (type === 'attachment' && status === 'malicious' ? 1 : 0),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file scan
    setPhase('analyze');
    setTimeout(() => setPhase('act'), 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'malicious': return 'text-[#FF2E63]';
      case 'suspicious': return 'text-yellow-500';
      default: return 'text-[#00FF94]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'malicious': return 'bg-[#FF2E63]/20';
      case 'suspicious': return 'bg-yellow-500/20';
      default: return 'bg-[#00FF94]/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-3 h-3" strokeWidth={1.5} />;
      case 'url': return <Link className="w-3 h-3" strokeWidth={1.5} />;
      case 'attachment': return <FileText className="w-3 h-3" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
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
            {p === 'observe' && <Mail className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'analyze' && <Shield className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            {p === 'act' && <CheckCircle className="w-3 h-3 text-[#A7B0C8]" strokeWidth={1.5} />}
            <span className={`font-micro text-[9px] tracking-widest uppercase ${
              phase === p ? 'text-[#00F5FF]' : 'text-[#A7B0C8]'
            }`}>
              {p}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Data Intake Portal */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`data-portal py-4 px-3 transition-all duration-300 ${
          isDragging ? 'dragover' : ''
        }`}
      >
        <motion.div
          animate={isDragging ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-[#00F5FF]' : 'text-[#A7B0C8]'}`} strokeWidth={1.5} />
        </motion.div>
        <p className="font-micro text-[10px] text-[#A7B0C8] tracking-widest uppercase text-center">
          Drop Email / URL / File
        </p>
        <p className="text-[9px] text-[#A7B0C8]/60 text-center mt-1">
          For instant threat analysis
        </p>
      </div>

      {/* Recent Scans */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Recent Detections
          </span>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'}`} />
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
              >
                <div className={`p-1 rounded ${getStatusBg(result.status)}`}>
                  {getTypeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-[#F5F7FF] truncate">{result.name}</p>
                </div>
                
                {/* Confidence Gauge */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={result.status === 'malicious' ? '#FF2E63' : result.status === 'suspicious' ? '#F59E0B' : '#00FF94'}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="100.5"
                      initial={{ strokeDashoffset: 100.5 }}
                      animate={{ strokeDashoffset: 100.5 - (result.threatScore / 100) * 100.5 }}
                      transition={{ duration: 0.5 }}
                      className={result.threatScore > 80 ? 'gauge-fill danger' : ''}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-mono text-[8px] ${getStatusColor(result.status)}`}>
                      {result.threatScore}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <span className="font-mono text-sm text-[#00F5FF]">{stats.emailsScanned.toLocaleString()}</span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">Emails</span>
        </div>
        <div className="text-center">
          <span className="font-mono text-sm text-[#FF2E63]">{stats.urlsBlocked.toLocaleString()}</span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">URLs</span>
        </div>
        <div className="text-center">
          <span className="font-mono text-sm text-[#00FF94]">{stats.attachmentsCleaned.toLocaleString()}</span>
          <span className="font-micro text-[8px] text-[#A7B0C8] tracking-widest uppercase block">Files</span>
        </div>
      </div>
    </div>
  );
}
