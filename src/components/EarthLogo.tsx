import React, { useEffect, useRef } from "react";
import * as THREE from "three";

import earthMapUrl from "@/assets/earth/earthmap1k.jpg";
import earthBumpUrl from "@/assets/earth/earthbump1k.jpg";
import earthSpecUrl from "@/assets/earth/earthspec1k.jpg";
import cloudsUrl from "@/assets/earth/earthcloudmaptrans.jpg";

interface EarthLogoProps {
  size?: number; // in pixels
}

const EarthLogo: React.FC<EarthLogoProps> = ({ size = 64 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size);

    container.innerHTML = ""; // clear if re-rendered
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Textures
    const loader = new THREE.TextureLoader();
    const [map, bump, spec, clouds] = [
      earthMapUrl,
      earthBumpUrl,
      earthSpecUrl,
      cloudsUrl,
    ].map((url) => loader.load(url));

    // Earth
    const earthGeo = new THREE.SphereGeometry(1, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.3,
      specularMap: spec,
      specular: new THREE.Color(0x333333),
      shininess: 15,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Clouds
    const cloudsGeo = new THREE.SphereGeometry(1.01, 64, 64);
    const cloudsMat = new THREE.MeshPhongMaterial({
      map: clouds,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // Subtle tilt for visual depth
    earthMesh.rotation.x = THREE.MathUtils.degToRad(15);
    cloudsMesh.rotation.x = THREE.MathUtils.degToRad(15);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      earthMesh.rotation.y += 0.0035;
      cloudsMesh.rotation.y += 0.005;
      renderer.render(scene, camera);
    };

    animate();

    // Pause rendering when tab hidden
    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        animate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animId) cancelAnimationFrame(animId);
      renderer.dispose();
      earthGeo.dispose();
      cloudsGeo.dispose();
      earthMat.dispose();
      cloudsMat.dispose();
      map.dispose();
      bump.dispose();
      spec.dispose();
      clouds.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="rounded-md shadow-[var(--shadow-glow)]"
      aria-label="Animated Earth logo"
      role="img"
    />
  );
};

export default EarthLogo;
