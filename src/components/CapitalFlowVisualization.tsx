import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere } from '@react-three/drei';
import { useRef, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Card } from '@/components/ui/card';
import { VaultDetailModal } from '@/components/VaultDetailModal';
import { useCapitalFlowData } from '@/hooks/useCapitalFlowData';
import { Loader2 } from 'lucide-react';

interface NodeData {
  position: [number, number, number];
  label: string;
  type: 'vault' | 'investor';
  id: string;
  amount?: string;
}

// Particle system for a single flow
const FlowParticles = ({ 
  from, 
  to, 
  color,
  isNew = false,
}: { 
  from: [number, number, number]; 
  to: [number, number, number]; 
  color: string;
  isNew?: boolean;
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = isNew ? 100 : 50;

  const { positions } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    return { positions };
  }, [particleCount]);

  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const speed = isNew ? 0.4 : 0.2;
    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const progress = ((time * speed + i / particleCount) % 1);
      const idx = i * 3;
      
      const mid = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2 + 1,
        (from[2] + to[2]) / 2 - 0.5,
      ];
      
      const t = progress;
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
        size={isNew ? 0.12 : 0.08}
        color={color}
        transparent
        opacity={isNew ? 1 : 0.8}
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

// Individual node sphere with click handler
const NodeSphere = ({ 
  position, 
  label, 
  type, 
  id,
  onClick,
}: NodeData & { onClick: (id: string, type: 'vault' | 'investor') => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { gl } = useThree();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      const scale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  const color = type === 'vault' ? '#2A9D8F' : '#E76F51';
  const baseScale = type === 'vault' ? 0.25 : 0.2;

  const handlePointerOver = useCallback(() => {
    setHovered(true);
    gl.domElement.style.cursor = 'pointer';
  }, [gl]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    gl.domElement.style.cursor = 'auto';
  }, [gl]);

  const handleClick = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick(id, type);
  }, [id, type, onClick]);

  return (
    <group position={position}>
      <Sphere 
        ref={meshRef} 
        args={[baseScale, 32, 32]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      {hovered && (
        <Sphere args={[baseScale * 1.5, 16, 16]}>
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </Sphere>
      )}
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

interface SceneProps {
  nodes: NodeData[];
  flows: Array<{ from: number; to: number; color: string; transactionId: string }>;
  newTransactionId: string | null;
  onNodeClick: (id: string, type: 'vault' | 'investor') => void;
}

const Scene = ({ nodes, flows, newTransactionId, onNodeClick }: SceneProps) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {nodes.map((node, index) => (
        <NodeSphere key={node.id} {...node} onClick={onNodeClick} />
      ))}
      
      {flows.map((flow, index) => (
        <group key={index}>
          <ConnectionLine
            from={nodes[flow.from]?.position || [0, 0, 0]}
            to={nodes[flow.to]?.position || [0, 0, 0]}
            color={flow.color}
          />
          <FlowParticles
            from={nodes[flow.from]?.position || [0, 0, 0]}
            to={nodes[flow.to]?.position || [0, 0, 0]}
            color={flow.color}
            isNew={flow.transactionId === newTransactionId}
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
  const {
    vaults,
    investors,
    flows,
    loading,
    newTransactionId,
    getVaultTransactions,
    getInvestorTransactions,
    getConnectedInvestors,
    getConnectedVaults,
  } = useCapitalFlowData();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<typeof vaults[0] | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<typeof investors[0] | null>(null);
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [connectedInvestors, setConnectedInvestors] = useState<typeof investors>([]);
  const [connectedVaults, setConnectedVaults] = useState<typeof vaults>([]);

  // Build nodes from database data
  const nodes: NodeData[] = useMemo(() => {
    const vaultNodes: NodeData[] = vaults.map(v => ({
      position: [Number(v.position_x), Number(v.position_y), Number(v.position_z)] as [number, number, number],
      label: `${v.country}\n$${(v.total_capital / 1000000).toFixed(0)}M`,
      type: 'vault' as const,
      id: v.id,
      amount: `$${(v.total_capital / 1000000).toFixed(0)}M`,
    }));

    const investorNodes: NodeData[] = investors.map(i => ({
      position: [Number(i.position_x), Number(i.position_y), Number(i.position_z)] as [number, number, number],
      label: i.name.split(' ').slice(0, 2).join('\n'),
      type: 'investor' as const,
      id: i.id,
    }));

    return [...vaultNodes, ...investorNodes];
  }, [vaults, investors]);

  const handleNodeClick = useCallback((id: string, type: 'vault' | 'investor') => {
    if (type === 'vault') {
      const vault = vaults.find(v => v.id === id);
      if (vault) {
        setSelectedVault(vault);
        setSelectedInvestor(null);
        setModalTransactions(getVaultTransactions(id));
        setConnectedInvestors(getConnectedInvestors(id));
        setConnectedVaults([]);
        setModalOpen(true);
      }
    } else {
      const investor = investors.find(i => i.id === id);
      if (investor) {
        setSelectedInvestor(investor);
        setSelectedVault(null);
        setModalTransactions(getInvestorTransactions(id));
        setConnectedVaults(getConnectedVaults(id));
        setConnectedInvestors([]);
        setModalOpen(true);
      }
    }
  }, [vaults, investors, getVaultTransactions, getInvestorTransactions, getConnectedInvestors, getConnectedVaults]);

  const totalActiveFlows = flows.reduce((sum, f) => {
    const amountStr = f.amount.replace('$', '').replace('M', '');
    return sum + parseFloat(amountStr);
  }, 0);

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Live Capital Flow Network
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Watch real-time capital flows between global investors and sovereign vaults across Africa. 
            Click on any node to view detailed information and transaction history.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Card className="p-2 bg-card border-border overflow-hidden">
            <div className="w-full h-[600px] bg-gradient-to-b from-foreground/5 to-background rounded-lg relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                  <Scene 
                    nodes={nodes} 
                    flows={flows} 
                    newTransactionId={newTransactionId}
                    onNodeClick={handleNodeClick}
                  />
                </Canvas>
              )}
              {newTransactionId && (
                <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg animate-pulse">
                  New Transaction Detected!
                </div>
              )}
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
                sustainable agriculture, and infrastructure development. Click to view details.
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
              <div className="text-2xl font-bold text-primary mb-1">
                ${totalActiveFlows.toFixed(0)}M
              </div>
              <div className="text-sm text-muted-foreground">Active Flows</div>
            </Card>
            <Card className="p-4 text-center bg-secondary/5 border-secondary/20">
              <div className="text-2xl font-bold text-secondary mb-1">{nodes.length}</div>
              <div className="text-sm text-muted-foreground">Network Nodes</div>
            </Card>
            <Card className="p-4 text-center bg-accent/5 border-accent/20">
              <div className="text-2xl font-bold text-accent mb-1">Live</div>
              <div className="text-sm text-muted-foreground">Real-time Tracking</div>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Interactive 3D visualization • Click nodes for details • Drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>

      <VaultDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vault={selectedVault}
        investor={selectedInvestor}
        transactions={modalTransactions}
        connectedInvestors={connectedInvestors}
        connectedVaults={connectedVaults}
      />
    </section>
  );
};

export default CapitalFlowVisualization;