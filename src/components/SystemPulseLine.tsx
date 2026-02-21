import { useEffect, useState } from 'react';
import { useBreach } from '../App';

export function SystemPulseLine() {
  const { isSystemUnderAttack } = useBreach();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed left-0 top-16 bottom-0 w-0.5 z-30 pointer-events-none">
      {/* Background track */}
      <div className="absolute inset-0 bg-[rgba(0,245,255,0.05)]" />
      
      {/* Active pulse line */}
      <div 
        className={`absolute top-0 left-0 w-full transition-all duration-100 ${
          isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'
        }`}
        style={{
          height: `${Math.max(5, scrollProgress)}%`,
          boxShadow: isSystemUnderAttack 
            ? '0 0 20px rgba(255, 46, 99, 0.8), 0 0 40px rgba(255, 46, 99, 0.4)'
            : '0 0 20px rgba(0, 245, 255, 0.8), 0 0 40px rgba(0, 245, 255, 0.4)',
        }}
      />

      {/* Pulse indicator at the tip */}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${
          isSystemUnderAttack ? 'bg-[#FF2E63]' : 'bg-[#00F5FF]'
        }`}
        style={{
          top: `${Math.max(5, scrollProgress)}%`,
          boxShadow: isSystemUnderAttack 
            ? '0 0 20px rgba(255, 46, 99, 1), 0 0 40px rgba(255, 46, 99, 0.6)'
            : '0 0 20px rgba(0, 245, 255, 1), 0 0 40px rgba(0, 245, 255, 0.6)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  );
}
