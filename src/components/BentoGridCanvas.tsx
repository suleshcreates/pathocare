import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlobalAttackGlobe } from './GlobalAttackGlobe';
import { ThreatCommandPanel } from './ThreatCommandPanel';
import { RansomwareGuard } from './RansomwareGuard';
import { PhishingShield } from './PhishingShield';
import { NetworkMonitor } from './NetworkMonitor';
import { AIDefenseEngine } from './AIDefenseEngine';
import { IdentityShield } from './IdentityShield';
import { CloudFabric } from './CloudFabric';
import { SOCCenter } from './SOCCenter';
import { LiveDefenseStream } from './LiveDefenseStream';
import { ResponseProtocols } from './ResponseProtocols';
import { CompliancePosture } from './CompliancePosture';
import { PricingPlans } from './PricingPlans';
import { FinalCTA } from './FinalCTA';
import { useBreach } from '../App';

interface BentoCard {
  id: string;
  component: React.ComponentType;
  defaultPosition: { x: number; y: number };
  size: 'small' | 'medium' | 'large' | 'full';
  title: string;
}

const bentoCards: BentoCard[] = [
  { id: 'threat-command', component: ThreatCommandPanel, defaultPosition: { x: 0, y: 0 }, size: 'large', title: 'Threat Command' },
  { id: 'globe', component: GlobalAttackGlobe, defaultPosition: { x: 1, y: 0 }, size: 'large', title: 'Global Attack Surface' },
  { id: 'live-defense', component: LiveDefenseStream, defaultPosition: { x: 0, y: 1 }, size: 'medium', title: 'Live Defense Stream' },
  { id: 'ai-engine', component: AIDefenseEngine, defaultPosition: { x: 1, y: 1 }, size: 'medium', title: 'AI Defense Engine' },
  { id: 'ransomware', component: RansomwareGuard, defaultPosition: { x: 2, y: 0 }, size: 'medium', title: 'Ransomware Guard' },
  { id: 'phishing', component: PhishingShield, defaultPosition: { x: 2, y: 1 }, size: 'small', title: 'Phishing Shield' },
  { id: 'network', component: NetworkMonitor, defaultPosition: { x: 0, y: 2 }, size: 'medium', title: 'Network Monitor' },
  { id: 'identity', component: IdentityShield, defaultPosition: { x: 1, y: 2 }, size: 'small', title: 'Identity Shield' },
  { id: 'cloud', component: CloudFabric, defaultPosition: { x: 2, y: 2 }, size: 'small', title: 'Cloud Fabric' },
  { id: 'soc', component: SOCCenter, defaultPosition: { x: 0, y: 3 }, size: 'medium', title: 'SOC Center' },
  { id: 'response', component: ResponseProtocols, defaultPosition: { x: 1, y: 3 }, size: 'small', title: 'Response Protocols' },
  { id: 'compliance', component: CompliancePosture, defaultPosition: { x: 2, y: 3 }, size: 'small', title: 'Compliance' },
];

export function BentoGridCanvas() {
  const [cards] = useState(bentoCards);
  const { isSystemUnderAttack } = useBreach();

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'full':
        return 'col-span-3 row-span-2';
      case 'large':
        return 'col-span-2 row-span-1';
      case 'medium':
        return 'col-span-1 row-span-1';
      case 'small':
        return 'col-span-1 row-span-1';
      default:
        return 'col-span-1 row-span-1';
    }
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      {/* Background Grid */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />

      {/* Section Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className={`font-heading text-3xl font-bold mb-2 transition-colors duration-300 ${
          isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#F5F7FF]'
        }`}>
          Command Center
        </h2>
        <p className="text-[#A7B0C8] text-sm">
          Real-time threat intelligence and autonomous defense systems
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-3 gap-4 auto-rows-min">
        {cards.map((card, index) => {
          const CardComponent = card.component;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.08,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className={`${getSizeClasses(card.size)}`}
            >
              <div className={`h-full glass-panel card-scanline overflow-hidden transition-all duration-300 ${
                isSystemUnderAttack ? 'border-[rgba(255,46,99,0.35)]' : ''
              }`}>
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,245,255,0.08)]">
                  <h3 className="font-micro text-[11px] text-[#A7B0C8] tracking-[0.15em] uppercase">
                    {card.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00FF94]'
                    }`} />
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="p-4">
                  <CardComponent />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pricing Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mt-12"
      >
        <PricingPlans />
      </motion.div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-12"
      >
        <FinalCTA />
      </motion.div>
    </div>
  );
}
