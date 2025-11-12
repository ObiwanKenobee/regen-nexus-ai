import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';

interface Node {
  position: [number, number, number];
  label: string;
  type: 'vault' | 'investor';
  amount?: string;
}

interface Flow {
  from: number;
  to: number;
  amount: string;
  color: string;
}

const nodes: Node[] = [
  // African Vault Nodes
  { position: [-2, 1, 0], label: 'Kenya\n$420M', type: 'vault', amount: '$420M' },
  { position: [-1, -1.5, 0], label: 'Rwanda\n$280M', type: 'vault', amount: '$280M' },
  { position: [0, 0.5, 0], label: 'Ghana\n$350M', type: 'vault', amount: '$350M' },
  { position: [1.5, -0.5, 0], label: 'Nigeria\nPlanned', type: 'vault' },
  
  // Global Investor Nodes
  { position: [-4, 3, -2], label: 'EU Impact\nFunds', type: 'investor' },
  { position: [3, 2, -1], label: 'Asian\nDevelopment', type: 'investor' },
  { position: [-3, -2, -1.5], label: 'US Climate\nInvestors', type: 'investor' },
  { position: [4, -1, -2], label: 'Universities\nNetwork', type: 'investor' },
];

const flows: Flow[] = [
  { from: 4, to: 0, amount: '$180M', color: '#2A9D8F' },
  { from: 5, to: 0, amount: '$120M', color: '#E76F51' },
  { from: 6, to: 1, amount: '$150M', color: '#F4A261' },
  { from: 7, to: 2, amount: '$200M', color: '#264653' },
  { from: 4, to: 2, amount: '$90M', color: '#2A9D8F' },
  { from: 5, to: 1, amount: '$80M', color: '#E76F51' },
];

// Particle system for a single flow
const FlowParticles = ({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  const { positions, particleIndices } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const particleIndices = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      particleIndices[i] = i / particleCount;
    }
    
    return { positions, particleIndices };
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const progress = ((time * 0.2 + i / particleCount) % 1);
      const idx = i * 3;
      
      // Bezier curve with slight arc
      const t = progress;
      const mid = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2 + 1,
        (from[2] + to[2]) / 2 - 0.5,
      ];
      
      // Quadratic bezier
      posArray[idx] = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * mid[0] + t * t * to[0];
      posArray[idx + 1] = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * mid[1] + t * t * to[1];
      posArray[idx + 2] = (1 - t) * (1 - t) * from[2] + 2 * (1 - t) * t * mid[2] + t * t * to[2];
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Connection line between nodes
const ConnectionLine = ({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) => {
  const points = useMemo(() => {
    const mid = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 1,
      (from[2] + to[2]) / 2 - 0.5,
    ];
    return [
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to),
    ];
  }, [from, to]);

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]), [points]);
  const curvePoints = useMemo(() => curve.getPoints(50), [curve]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={curvePoints.length}
          array={new Float32Array(curvePoints.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.2} linewidth={1} />
    </line>
  );
};

// Individual node sphere
const NodeSphere = ({ position, label, type }: Node) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  const color = type === 'vault' ? '#2A9D8F' : '#E76F51';
  const scale = type === 'vault' ? 0.25 : 0.2;

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[scale, 32, 32]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
};

// Main scene
const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {/* Render nodes */}
      {nodes.map((node, index) => (
        <NodeSphere key={index} {...node} />
      ))}
      
      {/* Render flows with particles */}
      {flows.map((flow, index) => (
        <group key={index}>
          <ConnectionLine
            from={nodes[flow.from].position}
            to={nodes[flow.to].position}
            color={flow.color}
          />
          <FlowParticles
            from={nodes[flow.from].position}
            to={nodes[flow.to].position}
            color={flow.color}
          />
        </group>
      ))}
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={5}
        maxDistance={15}
      />
    </>
  );
};

const CapitalFlowVisualization = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Live Capital Flow Network
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Watch real-time capital flows between global investors and sovereign vaults across Africa. 
            Each particle represents active transactions moving through the regenerative finance network.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="p-2 bg-card border-border overflow-hidden">
            <div className="w-full h-[600px] bg-gradient-to-b from-foreground/5 to-background rounded-lg">
              <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                <Scene />
              </Canvas>
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                African Sovereign Vaults
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Community-led financial hubs receiving regenerative capital for climate adaptation, 
                sustainable agriculture, and infrastructure development.
              </p>
            </Card>

            <Card className="p-6 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-accent"></div>
                Global Investor Network
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Impact investors, development agencies, and university partnerships channeling 
                capital through transparent, AI-verified sustainability metrics.
              </p>
            </Card>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Card className="p-4 text-center bg-primary/5 border-primary/20">
              <div className="text-2xl font-bold text-primary mb-1">$1.05B</div>
              <div className="text-sm text-muted-foreground">Active Flows</div>
            </Card>
            <Card className="p-4 text-center bg-secondary/5 border-secondary/20">
              <div className="text-2xl font-bold text-secondary mb-1">8</div>
              <div className="text-sm text-muted-foreground">Network Nodes</div>
            </Card>
            <Card className="p-4 text-center bg-accent/5 border-accent/20">
              <div className="text-2xl font-bold text-accent mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Live Tracking</div>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Interactive 3D visualization • Click and drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>
    </section>
  );
};

export default CapitalFlowVisualization;
