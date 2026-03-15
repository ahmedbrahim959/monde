import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Plane, Cone, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Cylinder args={[0.2, 0.2, 1]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#78350f" />
      </Cylinder>
      <Cone args={[1, 2]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#065f46" />
      </Cone>
    </group>
  );
}

function Lake({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <Plane args={[10, 10]} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
    </Plane>
  );
}

export function FlyingWorld() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.z += 10 * state.clock.getDelta();
      if (group.current.position.z > 50) {
        group.current.position.z -= 50;
      }
    }
  });

  return (
    <group>
      <Plane args={[200, 200]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <meshStandardMaterial color="#064e3b" />
      </Plane>
      
      <group ref={group}>
        {Array.from({ length: 40 }).map((_, i) => (
          <Tree key={`tree-${i}`} position={[(Math.random() - 0.5) * 60, -5, (Math.random() - 0.5) * 100 - 50]} />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <Tree key={`tree2-${i}`} position={[(Math.random() - 0.5) * 60, -5, (Math.random() - 0.5) * 100]} />
        ))}
        
        <Lake position={[-15, -4.9, -20]} color="#22d3ee" />
        <Lake position={[10, -4.9, -60]} color="#e879f9" />
        <Lake position={[-5, -4.9, -80]} color="#2dd4bf" />
        
        <Lake position={[-15, -4.9, 30]} color="#22d3ee" />
        <Lake position={[10, -4.9, -10]} color="#e879f9" />
      </group>
      
      {Array.from({ length: 15 }).map((_, i) => (
        <Sphere key={`cloud-${i}`} args={[Math.random() * 2 + 2, 16, 16]} position={[(Math.random() - 0.5) * 80, Math.random() * 10 + 10, (Math.random() - 0.5) * 100]}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
        </Sphere>
      ))}
    </group>
  );
}
