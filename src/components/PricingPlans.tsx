import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Building2, Sparkles } from 'lucide-react';
import { useBreach } from '../App';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$0',
    period: '/month',
    description: 'Essential monitoring for small teams',
    features: [
      'Real-time threat detection',
      'Basic phishing protection',
      'Email security',
      'Community support',
      'Up to 10 users',
    ],
    icon: Shield,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$99',
    period: '/month',
    description: 'Advanced detection + response',
    features: [
      'Everything in Starter',
      'AI-powered defense engine',
      'Ransomware protection',
      'Identity & access management',
      'Cloud security fabric',
      'Priority support',
      'Up to 100 users',
    ],
    highlighted: true,
    icon: Zap,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Dedicated support + custom models',
    features: [
      'Everything in Business',
      'Custom AI models',
      'Dedicated SOC team',
      'Advanced compliance',
      'API access',
      '24/7 phone support',
      'Unlimited users',
    ],
    icon: Building2,
  },
];

export function PricingPlans() {
  const { isSystemUnderAttack } = useBreach();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="py-12">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className={`font-heading text-3xl font-bold mb-3 transition-colors duration-300 ${
          isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#F5F7FF]'
        }`}>
          Choose Your Coverage
        </h2>
        <p className="text-[#A7B0C8] text-sm">
          Start free. Scale as you grow.
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          const isHovered = hoveredPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.highlighted 
                  ? 'bg-gradient-to-b from-[rgba(0,245,255,0.15)] to-[rgba(139,92,246,0.1)] border-2 border-[rgba(0,245,255,0.4)]'
                  : 'glass-panel'
              } ${isHovered ? 'transform -translate-y-2' : ''}`}
            >
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 py-2 bg-gradient-to-r from-[#00F5FF] to-[#8B5CF6] text-center">
                  <span className="font-micro text-[10px] text-[#0A0A0C] tracking-widest uppercase font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className={`p-6 ${plan.highlighted ? 'pt-12' : ''}`}>
                {/* Plan Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${
                    plan.highlighted ? 'bg-[rgba(0,245,255,0.2)]' : 'bg-[rgba(255,255,255,0.05)]'
                  }`}>
                    <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-[#00F5FF]' : 'text-[#A7B0C8]'}`} />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[#F5F7FF]">{plan.name}</h3>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className={`font-mono text-3xl font-bold ${plan.highlighted ? 'text-[#00F5FF]' : 'text-[#F5F7FF]'}`}>
                    {plan.price}
                  </span>
                  <span className="text-[#A7B0C8] text-sm">{plan.period}</span>
                </div>

                {/* Description */}
                <p className="text-[#A7B0C8] text-sm mb-6">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-[#00F5FF]' : 'text-[#00FF94]'
                      }`} strokeWidth={1.5} />
                      <span className="text-sm text-[#A7B0C8]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-xl font-micro text-sm tracking-widest uppercase transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#00F5FF] to-[#8B5CF6] text-[#0A0A0C] font-semibold hover:shadow-lg hover:shadow-[#00F5FF]/25'
                      : 'border border-[rgba(0,245,255,0.3)] text-[#00F5FF] hover:bg-[rgba(0,245,255,0.1)]'
                  }`}
                >
                  {plan.id === 'enterprise' ? 'Contact Sales' : plan.id === 'starter' ? 'Start Free' : 'Get Business'}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
          <span className="text-sm text-[#A7B0C8]">
            Need a custom solution? <span className="text-[#8B5CF6] cursor-pointer hover:underline">Talk to our team</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
