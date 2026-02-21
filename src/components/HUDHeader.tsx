import { useEffect, useRef, useState } from 'react';
import { Shield, Activity, Globe, Server, AlertTriangle } from 'lucide-react';
import { useBreach } from '../App';

export function HUDHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isSystemUnderAttack, threatLevel } = useBreach();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverHealth, setServerHealth] = useState(98.7);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate server health fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setServerHealth(prev => {
        const change = (Math.random() - 0.5) * 2;
        return Math.max(85, Math.min(100, prev + change));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // System Pulse Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;
    const waves: { amplitude: number; frequency: number; speed: number; offset: number }[] = [
      { amplitude: 15, frequency: 0.02, speed: 0.03, offset: 0 },
      { amplitude: 10, frequency: 0.015, speed: 0.02, offset: 1 },
      { amplitude: 8, frequency: 0.025, speed: 0.04, offset: 2 },
    ];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      // Draw each wave
      waves.forEach((wave, index) => {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x <= width; x++) {
          const y = height / 2 + 
            Math.sin(x * wave.frequency + phase * wave.speed + wave.offset) * 
            wave.amplitude * (serverHealth / 100);
          ctx.lineTo(x, y);
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        if (isSystemUnderAttack) {
          gradient.addColorStop(0, 'rgba(255, 46, 99, 0.1)');
          gradient.addColorStop(0.5, 'rgba(255, 46, 99, 0.8)');
          gradient.addColorStop(1, 'rgba(255, 46, 99, 0.1)');
        } else {
          gradient.addColorStop(0, 'rgba(0, 245, 255, 0.1)');
          gradient.addColorStop(0.5, `rgba(0, 245, 255, ${0.3 + index * 0.2})`);
          gradient.addColorStop(1, 'rgba(0, 245, 255, 0.1)');
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = isSystemUnderAttack ? 'rgba(255, 46, 99, 0.5)' : 'rgba(0, 245, 255, 0.5)';

      phase += 1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isSystemUnderAttack, serverHealth]);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'critical': return 'text-[#FF2E63]';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-[#00FF94]';
    }
  };

  const getThreatBg = () => {
    switch (threatLevel) {
      case 'critical': return 'bg-[#FF2E63]/20 border-[#FF2E63]/50';
      case 'high': return 'bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50';
      default: return 'bg-[#00FF94]/20 border-[#00FF94]/50';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16">
      {/* Glass Background */}
      <div className="absolute inset-0 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-[rgba(0,245,255,0.1)]" />
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-6">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-4">
          <div className={`relative p-2 rounded-xl transition-all duration-300 ${isSystemUnderAttack ? 'glow-danger' : 'glow-cyan'}`}>
            <Shield className={`w-6 h-6 ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`} strokeWidth={1.5} />
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isSystemUnderAttack ? 'bg-[#FF2E63] animate-pulse' : 'bg-[#00FF94]'}`} />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-[#F5F7FF]">
              CyberRakshak
            </h1>
            <p className="font-micro text-[10px] text-[#A7B0C8] tracking-widest uppercase">
              Autonomous Defense Cloud
            </p>
          </div>
        </div>

        {/* Center: System Pulse */}
        <div className="flex-1 mx-8 max-w-md">
          <div className="flex items-center gap-3 mb-1">
            <Activity className="w-3 h-3 text-[#00F5FF]" strokeWidth={1.5} />
            <span className="font-micro text-[10px] text-[#A7B0C8] tracking-widest uppercase">System Pulse</span>
            <span className="font-mono text-[10px] text-[#00F5FF]">{serverHealth.toFixed(1)}%</span>
          </div>
          <canvas 
            ref={canvasRef} 
            className="w-full h-8 rounded"
            style={{ width: '100%', height: '32px' }}
          />
        </div>

        {/* Right: Status & Info */}
        <div className="flex items-center gap-6">
          {/* Threat Level Ticker */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getThreatBg()} transition-all duration-300`}>
            <AlertTriangle className={`w-4 h-4 ${getThreatColor()}`} strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Threat Level</span>
              <span className={`font-mono text-xs font-semibold ${getThreatColor()} uppercase`}>
                {threatLevel}
              </span>
            </div>
          </div>

          {/* Global Nodes */}
          <div className="hidden lg:flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#8B5CF6]" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Global Nodes</span>
              <span className="font-mono text-xs text-[#F5F7FF]">12,847</span>
            </div>
          </div>

          {/* Server Status */}
          <div className="hidden md:flex items-center gap-2">
            <Server className="w-4 h-4 text-[#00FF94]" strokeWidth={1.5} />
            <div className="flex flex-col">
              <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase">Uptime</span>
              <span className="font-mono text-xs text-[#00FF94]">99.999%</span>
            </div>
          </div>

          {/* Time */}
          <div className="font-mono text-sm text-[#A7B0C8]">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
        </div>
      </div>
    </header>
  );
}
