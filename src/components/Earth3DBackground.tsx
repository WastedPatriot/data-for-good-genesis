import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Textures
import earthMapUrl from "@/assets/earth/earthmap1k.jpg";
import earthBumpUrl from "@/assets/earth/earthbump1k.jpg";
import earthSpecUrl from "@/assets/earth/earthspec1k.jpg";
import cloudsUrl from "@/assets/earth/earthcloudmaptrans.jpg";

const Earth3DBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = containerRef.current!;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0); // transparent
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x22c55e, 0.7);
    rimLight.position.set(-4, -2, -4);
    scene.add(rimLight);

    const group = new THREE.Group();
    scene.add(group);

    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load(earthMapUrl);
    const bumpTexture = loader.load(earthBumpUrl);
    const specTexture = loader.load(earthSpecUrl);
    earthTexture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.SphereGeometry(3.2, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.06,
      specularMap: specTexture,
      specular: new THREE.Color(0x222222),
      shininess: 12,
    });

    const earthMesh = new THREE.Mesh(geometry, material);
    group.add(earthMesh);

    // Clouds
    const cloudsTex = loader.load(cloudsUrl);
    const cloudsGeo = new THREE.SphereGeometry(3.28, 64, 64);
    const cloudsMat = new THREE.MeshLambertMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudsGeo, cloudsMat);
    group.add(clouds);

    // Soft atmospheric glow
    const glowGeo = new THREE.SphereGeometry(3.6, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#22c55e"),
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Parallax interaction
    let targetRX = 0;
    let targetRY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetRY = x * 0.25;
      targetRX = -y * 0.15;
    };

    const onScroll = () => {
      const t = window.scrollY / window.innerHeight;
      group.position.y = -t * 0.6;
      group.rotation.z = t * 0.1;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // Animate
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      // Smoothly follow pointer
      group.rotation.x += (targetRX - group.rotation.x) * 0.05;
      group.rotation.y += (targetRY - group.rotation.y) * 0.05;

      // Base rotation
      earthMesh.rotation.y += 0.0008;
      clouds.rotation.y += 0.0012;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss?.();
        rendererRef.current = null;
      }
      geometry.dispose();
      cloudsGeo.dispose();
      glowGeo.dispose();
      earthTexture.dispose();
      bumpTexture.dispose();
      specTexture.dispose();
      cloudsTex.dispose();
      glowMat.dispose();
      material.dispose();
      cloudsMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default Earth3DBackground;
