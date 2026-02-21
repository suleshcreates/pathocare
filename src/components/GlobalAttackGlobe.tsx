import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useBreach } from '../App';

// Globe component
function Globe({ isAttacked }: { isAttacked: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  // Create wireframe globe
  const globeGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(2, 3);
  }, []);

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: isAttacked ? 0xFF2E63 : 0x00F5FF,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
  }, [isAttacked]);

  const atmosphereMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: isAttacked ? 0xFF2E63 : 0x00F5FF,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
  }, [isAttacked]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <group>
      {/* Main Globe */}
      <mesh ref={meshRef} geometry={globeGeometry} material={wireframeMaterial} />
      
      {/* Atmosphere Glow */}
      <mesh ref={atmosphereRef} scale={1.2}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial {...atmosphereMaterial} />
      </mesh>

      {/* Inner Core */}
      <mesh scale={0.95}>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial 
          color={isAttacked ? 0x1a0508 : 0x0a1a1a}
          transparent 
          opacity={0.8} 
        />
      </mesh>
    </group>
  );
}

// Attack Arcs
function AttackArcs({ isAttacked }: { isAttacked: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [arcs, setArcs] = useState<{ id: number; start: THREE.Vector3; end: THREE.Vector3; progress: number }[]>([]);

  // Generate random attack arcs
  useEffect(() => {
    const generateArc = () => {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const phi2 = Math.random() * Math.PI * 2;
      const theta2 = Math.random() * Math.PI;

      const start = new THREE.Vector3(
        2.1 * Math.sin(theta) * Math.cos(phi),
        2.1 * Math.sin(theta) * Math.sin(phi),
        2.1 * Math.cos(theta)
      );

      const end = new THREE.Vector3(
        2.1 * Math.sin(theta2) * Math.cos(phi2),
        2.1 * Math.sin(theta2) * Math.sin(phi2),
        2.1 * Math.cos(theta2)
      );

      return { id: Date.now() + Math.random(), start, end, progress: 0 };
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setArcs(prev => [...prev.slice(-8), generateArc()]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Animate arcs
  useFrame(() => {
    setArcs(prev => prev.map(arc => ({ ...arc, progress: arc.progress + 0.02 })).filter(arc => arc.progress < 1));
  });

  return (
    <group ref={groupRef}>
      {arcs.map((arc) => {
        const mid = arc.start.clone().add(arc.end).multiplyScalar(0.5).normalize().multiplyScalar(3.5);
        const curve = new THREE.QuadraticBezierCurve3(arc.start, mid, arc.end);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive key={arc.id} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
            color: isAttacked ? 0xFF2E63 : 0x00F5FF,
            transparent: true,
            opacity: 1 - arc.progress,
          }))} />
        );
      })}
    </group>
  );
}

// Data Points on Globe
function DataPoints({ isAttacked }: { isAttacked: boolean }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 30; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      pts.push({
        position: new THREE.Vector3(
          2.05 * Math.sin(theta) * Math.cos(phi),
          2.05 * Math.sin(theta) * Math.sin(phi),
          2.05 * Math.cos(theta)
        ),
        intensity: Math.random(),
      });
    }
    return pts;
  }, []);

  return (
    <group>
      {points.map((point, i) => (
        <mesh key={i} position={point.position}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial 
            color={isAttacked ? 0xFF2E63 : 0x00F5FF}
            transparent
            opacity={0.3 + point.intensity * 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// Scene component
function Scene() {
  const { isSystemUnderAttack } = useBreach();

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      <Globe isAttacked={isSystemUnderAttack} />
      <AttackArcs isAttacked={isSystemUnderAttack} />
      <DataPoints isAttacked={isSystemUnderAttack} />
      
      <Stars 
        radius={100} 
        depth={50} 
        count={1000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

export function GlobalAttackGlobe() {
  const { isSystemUnderAttack, threatLevel } = useBreach();
  const [stats, setStats] = useState({
    attacksBlocked: 847291,
    activeThreats: 23,
    countries: 180,
  });

  // Simulate stat changes
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        attacksBlocked: prev.attacksBlocked + Math.floor(Math.random() * 50),
        activeThreats: Math.max(0, prev.activeThreats + Math.floor(Math.random() * 5) - 2),
        countries: prev.countries,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* 3D Globe */}
      <div className="flex-1 min-h-[200px]">
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
          <Scene />
        </Canvas>
      </div>

      {/* Stats Overlay */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="glass-panel-sm p-3 text-center">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block mb-1">
            Attacks Blocked
          </span>
          <span className={`font-mono text-lg font-semibold ${isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00F5FF]'}`}>
            {stats.attacksBlocked.toLocaleString()}
          </span>
        </div>
        <div className="glass-panel-sm p-3 text-center">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block mb-1">
            Active Threats
          </span>
          <span className={`font-mono text-lg font-semibold ${stats.activeThreats > 20 ? 'text-[#FF2E63]' : 'text-[#00FF94]'}`}>
            {stats.activeThreats}
          </span>
        </div>
        <div className="glass-panel-sm p-3 text-center">
          <span className="font-micro text-[9px] text-[#A7B0C8] tracking-widest uppercase block mb-1">
            Countries
          </span>
          <span className="font-mono text-lg font-semibold text-[#8B5CF6]">
            {stats.countries}+
          </span>
        </div>
      </div>

      {/* Threat Indicator */}
      <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-lg ${
        isSystemUnderAttack ? 'bg-[#FF2E63]/10 border border-[#FF2E63]/30' : 'bg-[#00FF94]/10 border border-[#00FF94]/30'
      }`}>
        <span className="font-micro text-[10px] text-[#A7B0C8] tracking-widest uppercase">
          Global Threat Level
        </span>
        <span className={`font-mono text-sm font-semibold uppercase ${
          isSystemUnderAttack ? 'text-[#FF2E63]' : 'text-[#00FF94]'
        }`}>
          {threatLevel}
        </span>
      </div>
    </div>
  );
}
