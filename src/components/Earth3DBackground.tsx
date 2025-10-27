import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Textures
import earthMapUrl from "@/assets/earth/earthmap1k.jpg";
import earthBumpUrl from "@/assets/earth/earthbump1k.jpg";
import earthSpecUrl from "@/assets/earth/earthspec1k.jpg";
import cloudsUrl from "@/assets/earth/earthcloudmaptrans.jpg";

// Create starfield
const createStarfield = () => {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });

  const starsVertices = [];
  for (let i = 0; i < 15000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  return new THREE.Points(starsGeometry, starsMaterial);
};

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

    // Add starfield background
    const starfield = createStarfield();
    scene.add(starfield);

    // Enhanced lighting setup
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    
    // Main directional light (sunlight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Green rim light for atmosphere
    const rimLight1 = new THREE.DirectionalLight(0x22c55e, 1.2);
    rimLight1.position.set(-4, -2, -4);
    scene.add(rimLight1);

    // Blue accent light
    const rimLight2 = new THREE.DirectionalLight(0x60a5fa, 0.8);
    rimLight2.position.set(4, 2, -3);
    scene.add(rimLight2);

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

    // Enhanced multi-layered atmospheric glow
    const glowGeo1 = new THREE.SphereGeometry(3.5, 64, 64);
    const glowMat1 = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#22c55e"),
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glow1 = new THREE.Mesh(glowGeo1, glowMat1);
    group.add(glow1);

    // Second glow layer (blue)
    const glowGeo2 = new THREE.SphereGeometry(3.7, 64, 64);
    const glowMat2 = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#60a5fa"),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glow2 = new THREE.Mesh(glowGeo2, glowMat2);
    group.add(glow2);

    // Outer glow layer
    const glowGeo3 = new THREE.SphereGeometry(4.0, 64, 64);
    const glowMat3 = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#a3e635"),
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glow3 = new THREE.Mesh(glowGeo3, glowMat3);
    group.add(glow3);

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
      
      // Rotate starfield slowly
      starfield.rotation.y += 0.0001;
      starfield.rotation.x += 0.00005;
      
      // Pulse glow layers
      const time = Date.now() * 0.001;
      glow1.scale.setScalar(1 + Math.sin(time * 0.5) * 0.02);
      glow2.scale.setScalar(1 + Math.sin(time * 0.7 + 1) * 0.03);
      glow3.scale.setScalar(1 + Math.sin(time * 0.3 + 2) * 0.04);
      
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
      glowGeo1.dispose();
      glowGeo2.dispose();
      glowGeo3.dispose();
      earthTexture.dispose();
      bumpTexture.dispose();
      specTexture.dispose();
      cloudsTex.dispose();
      glowMat1.dispose();
      glowMat2.dispose();
      glowMat3.dispose();
      material.dispose();
      cloudsMat.dispose();
      starfield.geometry.dispose();
      (starfield.material as THREE.PointsMaterial).dispose();
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
