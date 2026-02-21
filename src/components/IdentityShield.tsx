import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Lock, UserCheck, Key, Shield, AlertCircle } from 'lucide-react';
import { useBreach } from '../App';

interface User {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'suspicious';
  mfaEnabled: boolean;
}

export function IdentityShield() {
  const { isSystemUnderAttack } = useBreach();
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'admin@corp.com', role: 'Admin', status: 'active', mfaEnabled: true },
    { id: '2', name: 'user@corp.com', role: 'User', status: 'active', mfaEnabled: true },
    { id: '3', name: 'dev@corp.com', role: 'Developer', status: 'idle', mfaEnabled: true },
  ]);
  const [stats, setStats] = useState({
    mfaAdoption: 100,
    privilegedAccounts: 12,
    sessionsActive: 47,
    accessRequests: 3,
  });

  // Simulate user activity
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prev => prev.map(user => ({
        ...user,
        status: Math.random() > 0.7 ? 
          (Math.random() > 0.5 ? 'active' : Math.random() > 0.5 ? 'idle' : 'suspicious') : 
          user.status,
      })));

      setStats(prev => ({
        ...prev,
        sessionsActive: prev.sessionsActive + Math.floor(Math.random() * 5) - 2,
        accessRequests: Math.max(0, prev.accessRequests + Math.floor(Math.random() * 3) - 1),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'suspicious': return 'text-[#FF2E63]';
      case 'idle': return 'text-yellow-500';
      default: return 'text-[#00FF94]';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'suspicious': return 'bg-[#FF2E63]/20';
      case 'idle': return 'bg-yellow-500/20';
      default: return 'bg-[#00FF94]/20';
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Biometric Scanner Visual */}
      <div className="relative h-20 rounded-lg overflow-hidden bg-[rgba(0,0,0,0.3)] flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          <Fingerprint className={`w-12 h-12 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`} strokeWidth={1} />
        </motion.div>
        
        {/* Scan Line */}
        <motion.div
          className={`absolute left-0 right-0 h-px ${isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'}`}
          animate={{
            top: ['20%', '80%', '20%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* MFA Status */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,255,148,0.1)] border border-[rgba(0,255,148,0.2)]">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">MFA Adoption</span>
        </div>
        <span className="font-mono text-lg font-semibold text-[#00FF94]">{stats.mfaAdoption}%</span>
      </div>

      {/* Active Users */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Active Sessions
          </span>
          <span className="font-mono text-xs text-[#F5F7FF]">{stats.sessionsActive}</span>
        </div>

        <div className="space-y-2">
          {users.map((user) => (
            <motion.div
              key={user.id}
              className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStatusBg(user.status)}`}>
                  <UserCheck className={`w-3 h-3 ${getStatusColor(user.status)}`} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-mono text-[10px] text-[#F5F7FF]">{user.name}</p>
                  <p className="font-micro text-[8px] text-[#A7B0C8]">{user.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.mfaEnabled && <Key className="w-3 h-3 text-[#00FF94]" strokeWidth={1.5} />}
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(user.status).replace('text-', 'bg-')}`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Access Requests */}
      {stats.accessRequests > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(255,46,99,0.1)] border border-[rgba(255,46,99,0.2)]"
        >
          <AlertCircle className="w-4 h-4 text-[#FF2E63]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">
            Pending Access Requests
          </span>
          <span className="font-mono text-sm text-[#FF2E63] ml-auto">{stats.accessRequests}</span>
        </motion.div>
      )}

      {/* Privileged Accounts */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-[rgba(0,0,0,0.2)]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Privileged Accounts</span>
        </div>
        <span className="font-mono text-sm text-[#8B5CF6]">{stats.privilegedAccounts}</span>
      </div>
    </div>
  );
}
