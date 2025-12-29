import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  PresentationControls,
  Stage,
  useGLTF,
  Html,
  useProgress,
  Float,
  Text3D,
  MeshDistortMaterial
} from '@react-three/drei'
import { motion } from 'framer-motion'
import { RotateCcw, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import FallbackModel from './FallbackModel'
import ErrorBoundary from '../ui/ErrorBoundary'
import Button from '../ui/Button'

// Loading component for 3D models
const Loader = () => {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <div className="text-sm text-gray-600">
          Loading 3D Model... {Math.round(progress)}%
        </div>
      </div>
    </Html>
  )
}

// Enhanced 3D Model Component with animations
const Model = ({ url, color = '#ffffff', material = 'standard', scale = 1, ...props }) => {
  const meshRef = useRef()
  
  // Add floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
    }
  })
  
  // Always use fallback for now since we don't have real GLB files
  // In production, you would check if the URL exists and load accordingly
  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <FallbackModel 
        ref={meshRef}
        color={color} 
        material={material} 
        scale={scale} 
        {...props} 
      />
    </Float>
  )
}

// Camera Controls Component
const CameraControls = ({ onReset }) => {
  const { camera, gl } = useThree()
  const controlsRef = useRef()

  const handleZoomIn = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyIn(1.2)
      controlsRef.current.update()
    }
  }

  const handleZoomOut = () => {
    if (controlsRef.current) {
      controlsRef.current.dollyOut(1.2)
      controlsRef.current.update()
    }
  }

  const handleRotateLeft = () => {
    if (controlsRef.current) {
      controlsRef.current.rotateLeft(0.2)
      controlsRef.current.update()
    }
  }

  const handleRotateRight = () => {
    if (controlsRef.current) {
      controlsRef.current.rotateLeft(-0.2)
      controlsRef.current.update()
    }
  }

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
      onReset?.()
    }
  }

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        args={[camera, gl.domElement]}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={10}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
      
      {/* Control Buttons */}
      <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }}>
        <motion.div 
          className="fixed bottom-4 right-4 flex flex-col space-y-2" 
          style={{ pointerEvents: 'auto' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleZoomIn}
              className="p-2 glass"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleZoomOut}
              className="p-2 glass"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleRotateLeft}
              className="p-2 glass"
              title="Rotate Left"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="secondary"
              size="small"
              onClick={handleRotateRight}
              className="p-2 glass"
              title="Rotate Right"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="outline"
              size="small"
              onClick={handleReset}
              className="p-2 glass"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </Html>
    </>
  )
}

// Main ProductViewer Component
const ProductViewer = ({ 
  modelUrl, 
  color = '#ffffff', 
  material = 'standard',
  environment = 'city',
  className = '',
  showControls = true,
  autoRotate = false
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Default model URL if none provided
  const defaultModelUrl = '/models/default-product.glb'
  const finalModelUrl = modelUrl || defaultModelUrl

  const handleModelLoad = () => {
    setIsLoading(false)
  }

  const handleModelError = (error) => {
    console.error('3D Model loading error:', error)
    setError('Failed to load 3D model')
    setIsLoading(false)
  }

  return (
    <motion.div 
      className={`relative w-full h-full min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ErrorBoundary fallbackMessage="3D model could not be loaded">
        {error ? (
          <motion.div 
            className="flex items-center justify-center h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <motion.div
                className="text-gray-400 mb-2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">3D model not available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{error}</p>
            </div>
          </motion.div>
        ) : (
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            shadows
            onCreated={() => handleModelLoad()}
          >
            <Suspense fallback={<Loader />}>
              {/* Enhanced Lighting */}
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-10, -10, -5]} intensity={0.5} />
              <spotLight
                position={[0, 10, 0]}
                angle={0.3}
                penumbra={1}
                intensity={0.5}
                castShadow
              />

              {/* Environment */}
              <Environment preset={environment} />

              {/* Stage for better presentation */}
              <Stage
                contactShadow={{ opacity: 0.2, blur: 2 }}
                environment={environment}
                preset="rembrandt"
                intensity={0.5}
              >
                {/* Enhanced 3D Model with animations */}
                <Model
                  url={finalModelUrl}
                  color={color}
                  material={material}
                  scale={1}
                  onError={handleModelError}
                />
              </Stage>

              {/* Controls */}
              {showControls && <CameraControls />}
            </Suspense>
          </Canvas>
        )}
      </ErrorBoundary>

      {/* Loading Overlay with animation */}
      {isLoading && (
        <motion.div 
          className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="text-center">
            <motion.div 
              className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p 
              className="text-gray-600 dark:text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading 3D Model...
            </motion.p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ProductViewer