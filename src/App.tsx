import { OrbitControls } from '@react-three/drei'
import { Sky, Grid, SpriteAnimator } from '@react-three/drei'
import React from 'react'
import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'

var options = {
  gridSize: [30, 16],
  cellSize: 1.0,
  cellThickness: 1.0,
  cellColor: '#707070',
  sectionSize: 5.0,
  sectionThickness: 1.5,
  sectionColor: '#1e1e1e', //'#00ffd9',
  fadeDistance: 50,
  fadeStrength: 1,
  followCamera: false,
  infiniteGrid: true,
}

export function App() {
  const [frameName, setFrameName] = useState('idle')

  const onClick = () => {
    console.log('clicked')
    setFrameName('celebration')
  }

  const onEnd = ({ currentFrameName, currentFrame }) => {
    if (currentFrameName === 'celebration') {
      setFrameName('idle')
    }
  }

  return (
    <Canvas
      camera={{
        position: [10, 15, -10],
        fov: '45',
        far: 1000,
        near: 0.1,
        aspectRatio: window.innerWidth / window.innerHeight,
      }}
    >
      <Suspense fallback={null}>
        <OrbitControls
          target={[2.5, 0.5, 0.5]}
          maxPolarAngle={Math.PI * 0.4}
          minPolarAngle={-Math.PI * 0.5}
          enablePan={false}
          maxDistance={30.0}
          minDistance={1.0}
          enableRotate={true}
          enableZoom={true}
          //enableDamping={true}
          dampingFactor={0.1}
          rotateSpeed={0.5}
        />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />

        <SpriteAnimator
          scale={[4, 4, 4]}
          position={[0, -0.25, 1.2]}
          startFrame={0}
          fps={40}
          autoPlay={true}
          loop={true}
          textureImageURL={'./flame.png'}
          textureDataURL={'./flame.json'}
          alphaTest={0.01}
        />
        <SpriteAnimator
          scale={[4, 4, 4]}
          position={[2.5, -0.25, 0.1]}
          startFrame={0}
          autoPlay={true}
          loop={true}
          textureImageURL={'./flame.png'}
          textureDataURL={'./flame.json'}
          alphaTest={0.01}
        />
        <SpriteAnimator
          scale={[4, 4, 4]}
          position={[-2.5, -0.25, 0.1]}
          startFrame={0}
          autoPlay={true}
          loop={true}
          textureImageURL={'./flame.png'}
          textureDataURL={'./flame.json'}
          alphaTest={0.01}
        />
        <SpriteAnimator
          scale={[2, 2, 2]}
          position={[-3.5, -2.0, 2.5]}
          startFrame={0}
          autoPlay={true}
          loop={true}
          numberOfFrames={16}
          alphaTest={0.01}
          textureImageURL={'./alien.png'}
        />

        <group onClick={onClick}>
          <SpriteAnimator
            scale={[4, 4, 4]}
            position={[0.0, -2.0, -1.5]}
            onLoopEnd={onEnd}
            frameName={frameName}
            fps={24}
            animationNames={['idle', 'celebration']}
            autoPlay={true}
            loop={true}
            alphaTest={0.01}
            textureImageURL={'./boy_hash.png'}
            textureDataURL={'./boy_hash.json'}
          />
        </group>
      </Suspense>
      <Grid {...options} position={[0, -3.0, 0.0]} />
    </Canvas>
  )
}
