import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const FallbackModel = ({ color = '#3b82f6', material = 'standard', scale = 1 }) => {
  const meshRef = useRef()
  
  // Auto-rotate animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1
    }
  })

  // Material properties based on material type
  const getMaterialProps = () => {
    switch (material) {
      case 'metallic':
        return { metalness: 0.8, roughness: 0.2 }
      case 'glass':
        return { transparent: true, opacity: 0.8, metalness: 0, roughness: 0 }
      case 'matte':
        return { metalness: 0, roughness: 0.8 }
      default:
        return { metalness: 0.1, roughness: 0.5 }
    }
  }

  const materialProps = getMaterialProps()

  return (
    <group ref={meshRef} scale={scale}>
      {/* Main body - box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
      
      {/* Top accent - sphere */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
      
      {/* Side accents - cylinders */}
      <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
      
      <mesh position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
      
      {/* Base - torus */}
      <mesh position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.2, 8, 16]} />
        <meshStandardMaterial 
          color={color} 
          {...materialProps}
        />
      </mesh>
    </group>
  )
}

export default FallbackModel