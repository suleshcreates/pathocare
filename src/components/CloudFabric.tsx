import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Server, Database, Container, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import { useBreach } from '../App';

interface CloudResource {
  id: string;
  name: string;
  type: 'compute' | 'storage' | 'container';
  provider: 'aws' | 'azure' | 'gcp';
  status: 'healthy' | 'warning' | 'critical';
  compliance: boolean;
}

export function CloudFabric() {
  const { isSystemUnderAttack } = useBreach();
  const [resources] = useState<CloudResource[]>([
    { id: '1', name: 'prod-cluster-01', type: 'compute', provider: 'aws', status: 'healthy', compliance: true },
    { id: '2', name: 'data-warehouse', type: 'storage', provider: 'azure', status: 'healthy', compliance: true },
    { id: '3', name: 'api-gateway', type: 'container', provider: 'gcp', status: 'healthy', compliance: true },
  ]);
  const [stats, setStats] = useState({
    resourcesMonitored: 2100000,
    misconfigurations: 0,
    complianceScore: 98,
  });

  // Simulate resource changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        resourcesMonitored: prev.resourcesMonitored + Math.floor(Math.random() * 100),
        misconfigurations: Math.max(0, prev.misconfigurations + Math.floor(Math.random() * 3) - 1),
        complianceScore: Math.min(100, Math.max(90, prev.complianceScore + Math.floor(Math.random() * 5) - 2)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'aws': return 'text-orange-400';
      case 'azure': return 'text-blue-400';
      case 'gcp': return 'text-red-400';
      default: return 'text-[#A7B0C8]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-[#FF2E63]';
      case 'warning': return 'text-yellow-500';
      default: return 'text-[#00FF94]';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compute': return <Server className="w-3 h-3" strokeWidth={1.5} />;
      case 'storage': return <Database className="w-3 h-3" strokeWidth={1.5} />;
      case 'container': return <Container className="w-3 h-3" strokeWidth={1.5} />;
      default: return <Cloud className="w-3 h-3" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Cloud Visualization */}
      <div className="relative h-20 rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)] flex items-center justify-center">
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Cloud className={`w-14 h-14 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`} strokeWidth={1} />
        </motion.div>
        
        {/* Connected Nodes */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 30}%`,
              top: '60%',
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Server className={`w-4 h-4 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#8B5CF6]'}`} strokeWidth={1.5} />
          </motion.div>
        ))}
      </div>

      {/* Resources Monitored */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.2)]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00F5FF]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Resources</span>
        </div>
        <span className="font-mono text-lg font-semibold text-[#00F5FF]">
          {(stats.resourcesMonitored / 1000000).toFixed(1)}M
        </span>
      </div>

      {/* Cloud Resources */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Critical Resources
          </span>
        </div>

        <div className="space-y-2">
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-[rgba(255,255,255,0.05)]">
                  {getTypeIcon(resource.type)}
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#F5F7FF]">{resource.name}</p>
                  <p className={`font-micro text-[8px] uppercase ${getProviderColor(resource.provider)}`}>
                    {resource.provider}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {resource.compliance && <CheckCircle className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />}
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(resource.status).replace('text-', 'bg-')}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Compliance Score */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Compliance</span>
        <span className={`font-mono text-sm ${stats.complianceScore > 95 ? 'text-[#00FF94]' : 'text-yellow-500'}`}>
          {stats.complianceScore}%
        </span>
      </div>

      {/* Misconfigurations Alert */}
      {stats.misconfigurations > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,46,99,0.1)] border border-[rgba(255,46,99,0.2)]"
        >
          <AlertTriangle className="w-4 h-4 text-[#FF2E63]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Misconfigurations
          </span>
          <span className="font-mono text-sm text-[#FF2E63] ml-auto">{stats.misconfigurations}</span>
        </motion.div>
      )}
    </div>
  );
}
