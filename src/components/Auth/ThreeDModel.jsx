// ThreeDModel.jsx
import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera } from '@react-three/drei';

const Model = ({ url, rotate }) => {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  // This will run every frame when rotate is true
  useFrame(() => {
    if (rotate && modelRef.current) {
      modelRef.current.rotation.y += 0.01; // Adjust this value for speed
    }
  });

  return <primitive ref={modelRef} object={scene} scale={0.022} position={[0, -0.2, 0]} />;
};

const CameraController = ({ view, zoomDirection, rotate }) => {
  const { camera } = useThree();
  const controlsRef = useRef();
  const targetPos = useRef([5, 5, 5]);
  const targetZoom = useRef(1);
  const rotationSpeed = useRef(0);

  useEffect(() => {
    // Set rotation speed based on rotate prop
    rotationSpeed.current = rotate ? 1 : 0;
  }, [rotate]);

  useEffect(() => {
    const distance = 10;
    switch (view) {
      case 'top':
        targetPos.current = [0, distance, 0];
        targetZoom.current = 1.3;
        break;
      case 'front':
        targetPos.current = [0, 0, distance];
        targetZoom.current = 1.3;
        break;
      case 'back':
        targetPos.current = [0.2, 0.2, -distance];
        targetZoom.current = 1.3;
        break;
      case 'left':
        targetPos.current = [-distance, 0, 0];
        targetZoom.current = 1.2;
        break;
      case 'right':
        targetPos.current = [distance, 0, 0];
        targetZoom.current = 1.2;
        break;
      case 'isometric':
      default:
        targetPos.current = [5, 5, 5];
        targetZoom.current = 1;
        break;
    }
  }, [view]);

  useEffect(() => {
    if (zoomDirection !== 0) {
      targetZoom.current += zoomDirection * 0.1;
      targetZoom.current = Math.max(0.5, Math.min(targetZoom.current, 2));
      camera.zoom = targetZoom.current;
      camera.updateProjectionMatrix();
    }
  }, [zoomDirection, camera]);

  useFrame(() => {
    const [x, y, z] = targetPos.current;
    camera.position.lerp({ x, y, z }, 0.05);
    camera.lookAt(0, 0, 0);
    
    // Manual rotation when rotate is true
    if (rotationSpeed.current !== 0 && controlsRef.current) {
      controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + rotationSpeed.current * 0.01);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      enableDamping
      dampingFactor={0.25}
      rotateSpeed={0.5}
      minDistance={3}
      maxDistance={20}
      makeDefault
    />
  );
};

const ThreeDModel = ({ url, view = 'isometric', zoomDirection = 0, rotate = false, onRotateToggle }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ height: '900px', width: '1000px', position: 'relative' }}>
        <Canvas>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Suspense fallback={null}>
            <Model url={url} rotate={rotate} />
          </Suspense>
          <CameraController
            view={view}
            zoomDirection={zoomDirection}
            rotate={rotate}
          />
        </Canvas>
      </div>
    </div>
  );
};

export default ThreeDModel;