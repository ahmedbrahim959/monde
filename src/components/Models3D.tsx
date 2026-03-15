import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Cone, Trail } from '@react-three/drei';
import * as THREE from 'three';

export function GuideRobot({ position }: { position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      group.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Head */}
      <Box args={[1, 1, 1]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      {/* Eyes */}
      <Sphere args={[0.15]} position={[-0.25, 1.6, 0.51]}>
        <meshBasicMaterial color="#60a5fa" />
      </Sphere>
      <Sphere args={[0.15]} position={[0.25, 1.6, 0.51]}>
        <meshBasicMaterial color="#60a5fa" />
      </Sphere>
      {/* Body */}
      <Cylinder args={[0.6, 0.6, 1.2]} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#e5e7eb" />
      </Cylinder>
      {/* Arms */}
      <Cylinder args={[0.15, 0.15, 1]} position={[-0.8, 0.2, 0]} rotation={[0, 0, 0.5]}>
        <meshStandardMaterial color="#9ca3af" />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 1]} position={[0.8, 0.2, 0]} rotation={[0, 0, -0.5]}>
        <meshStandardMaterial color="#9ca3af" />
      </Cylinder>
    </group>
  );
}

export function CompanionModel({ id, color, isFlying = false }: { id: string, color: string, isFlying?: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      if (isFlying) {
        group.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.5;
        group.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        group.current.rotation.x = 0.2; // Tilt forward
      } else {
        group.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const material = <meshStandardMaterial color={color} roughness={0.4} />;

  return (
    <group ref={group}>
      {isFlying && (
        <Trail width={0.5} color={color} length={10} decay={1} local={false}>
          <group position={[0, 0, 0]} />
        </Trail>
      )}
      
      {id === 'lion' && (
        <group>
          <Sphere args={[0.6]} position={[0, 0.6, 0]}>{material}</Sphere>
          <Sphere args={[0.8]} position={[0, 0.6, -0.2]}><meshStandardMaterial color="#ca8a04" /></Sphere>
          <Box args={[0.8, 0.8, 0.8]} position={[0, -0.2, 0]}>{material}</Box>
        </group>
      )}
      {id === 'pingouin' && (
        <group>
          <Cylinder args={[0.4, 0.5, 1.2]} position={[0, 0, 0]}><meshStandardMaterial color="#1f2937" /></Cylinder>
          <Cylinder args={[0.3, 0.4, 1.0]} position={[0, 0, 0.1]}><meshStandardMaterial color="#ffffff" /></Cylinder>
          <Cone args={[0.2, 0.4]} position={[0, 0.4, 0.5]} rotation={[Math.PI/2, 0, 0]}><meshStandardMaterial color="#f59e0b" /></Cone>
        </group>
      )}
      {id === 'fee' && (
        <group>
          <Sphere args={[0.5]} position={[0, 0.5, 0]}>{material}</Sphere>
          <Cone args={[0.6, 1]} position={[0, -0.4, 0]}><meshStandardMaterial color="#fbcfe8" /></Cone>
          <Sphere args={[0.4, 16, 16]} position={[-0.5, 0.2, -0.2]} scale={[1, 0.5, 0.1]}><meshStandardMaterial color="#ffffff" transparent opacity={0.6} /></Sphere>
          <Sphere args={[0.4, 16, 16]} position={[0.5, 0.2, -0.2]} scale={[1, 0.5, 0.1]}><meshStandardMaterial color="#ffffff" transparent opacity={0.6} /></Sphere>
        </group>
      )}
      {id === 'robot' && (
        <group>
          <Box args={[0.8, 0.6, 0.6]} position={[0, 0.5, 0]}>{material}</Box>
          <Box args={[0.6, 0.8, 0.5]} position={[0, -0.3, 0]}><meshStandardMaterial color="#d1d5db" /></Box>
          <Cylinder args={[0.05, 0.05, 0.5]} position={[0, 1, 0]}><meshStandardMaterial color="#ef4444" /></Cylinder>
        </group>
      )}
      {id === 'chat' && (
        <group>
          <Sphere args={[0.5]} position={[0, 0.5, 0]}>{material}</Sphere>
          <Cone args={[0.2, 0.4]} position={[-0.3, 0.9, 0]}><meshStandardMaterial color={color} /></Cone>
          <Cone args={[0.2, 0.4]} position={[0.3, 0.9, 0]}><meshStandardMaterial color={color} /></Cone>
          <Cylinder args={[0.4, 0.4, 0.8]} position={[0, -0.2, 0]}>{material}</Cylinder>
        </group>
      )}
      
      <group position={[0, 0.6, 0.45]}>
        <Sphere args={[0.08]} position={[-0.2, 0, 0]}><meshBasicMaterial color="#000" /></Sphere>
        <Sphere args={[0.08]} position={[0.2, 0, 0]}><meshBasicMaterial color="#000" /></Sphere>
      </group>
    </group>
  );
}
