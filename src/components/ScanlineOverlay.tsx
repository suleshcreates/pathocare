interface ScanlineOverlayProps {
  active: boolean;
}

export function ScanlineOverlay({ active }: ScanlineOverlayProps) {
  return (
    <div className={`scanline-overlay ${active ? 'active' : ''}`}>
      {/* Additional CRT-style scanline effects */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: active 
            ? 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 46, 99, 0.02) 2px, rgba(255, 46, 99, 0.02) 4px)'
            : 'none',
        }}
      />
      {/* Vignette effect during breach */}
      {active && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(255, 46, 99, 0.1) 100%)',
          }}
        />
      )}
    </div>
  );
}
