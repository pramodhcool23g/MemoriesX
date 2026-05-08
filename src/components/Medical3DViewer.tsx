/// <reference types="nativewind/types" />
import React, { Suspense, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Canvas, useFrame, useLoader } from '@react-three/fiber/native';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

const Model = ({ url }: { url: string }) => {
    const gltf = useLoader(GLTFLoader, url);
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.5;
        }
    });

    return <primitive ref={meshRef} object={gltf.scene} scale={2} />;
};

const Medical3DViewer = ({ modelUrl }: { modelUrl: string }) => {
    return (
        <View className="h-80 bg-slate-900 rounded-3xl overflow-hidden my-6">
            <Suspense fallback={
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color="#0F766E" size="large" />
                </View>
            }>
                <Canvas>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Model url={modelUrl} />
                </Canvas>
            </Suspense>
        </View>
    );
};

export default Medical3DViewer;
