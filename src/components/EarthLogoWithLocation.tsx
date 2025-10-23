import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import earthMapUrl from "@/assets/earth/earthmap1k.jpg";
import earthBumpUrl from "@/assets/earth/earthbump1k.jpg";
import earthSpecUrl from "@/assets/earth/earthspec1k.jpg";
import cloudsUrl from "@/assets/earth/earthcloudmaptrans.jpg";

interface EarthLogoWithLocationProps {
  size?: number;
  showLocationMarker?: boolean;
}

const EarthLogoWithLocation: React.FC<EarthLogoWithLocationProps> = ({ 
  size = 64, 
  showLocationMarker = false 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // Get user's location based on timezone and geolocation
  useEffect(() => {
    if (!showLocationMarker) return;

    // Get timezone-based rough location first
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timezoneCoords: Record<string, { lat: number; lon: number }> = {
      'America/New_York': { lat: 40.7128, lon: -74.0060 },
      'America/Chicago': { lat: 41.8781, lon: -87.6298 },
      'America/Denver': { lat: 39.7392, lon: -104.9903 },
      'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
      'Europe/London': { lat: 51.5074, lon: -0.1278 },
      'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
      'Europe/Berlin': { lat: 52.5200, lon: 13.4050 },
      'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },
      'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
      'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
      'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
      'Pacific/Auckland': { lat: -36.8485, lon: 174.7633 },
    };

    if (timezoneCoords[timezone]) {
      setUserLocation(timezoneCoords[timezone]);
    }

    // Try to get more accurate location with user permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using timezone estimate');
        }
      );
    }
  }, [showLocationMarker]);

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

    container.innerHTML = "";
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

    // Location marker
    let markerMesh: THREE.Mesh | null = null;
    let markerGlow: THREE.Mesh | null = null;

    if (showLocationMarker && userLocation) {
      // Convert lat/lon to 3D coordinates
      const phi = (90 - userLocation.lat) * (Math.PI / 180);
      const theta = (userLocation.lon + 180) * (Math.PI / 180);
      const radius = 1.02;

      // Red marker
      const markerGeo = new THREE.SphereGeometry(0.03, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
      });
      markerMesh = new THREE.Mesh(markerGeo, markerMat);
      
      markerMesh.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      
      scene.add(markerMesh);

      // Glowing ring around marker
      const glowGeo = new THREE.RingGeometry(0.035, 0.05, 32);
      const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0xff6666,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      markerGlow = new THREE.Mesh(glowGeo, glowMat);
      markerGlow.position.copy(markerMesh.position);
      markerGlow.lookAt(0, 0, 0);
      scene.add(markerGlow);

      // Rotate Earth to show user's location
      earthMesh.rotation.y = -theta + Math.PI / 2;
      cloudsMesh.rotation.y = -theta + Math.PI / 2;
    }

    // Subtle tilt
    earthMesh.rotation.x = THREE.MathUtils.degToRad(15);
    cloudsMesh.rotation.x = THREE.MathUtils.degToRad(15);

    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      
      if (!showLocationMarker || !userLocation) {
        earthMesh.rotation.y += 0.0035;
        cloudsMesh.rotation.y += 0.005;
      } else {
        // Slower rotation when showing location
        earthMesh.rotation.y += 0.001;
        cloudsMesh.rotation.y += 0.0015;
      }
      
      // Pulse marker glow
      if (markerGlow) {
        const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.6;
        markerGlow.material.opacity = pulse;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    const handleVisibility = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        animate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

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
      if (markerMesh) {
        markerMesh.geometry.dispose();
        (markerMesh.material as THREE.Material).dispose();
      }
      if (markerGlow) {
        markerGlow.geometry.dispose();
        (markerGlow.material as THREE.Material).dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, userLocation, showLocationMarker]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="rounded-md shadow-[var(--shadow-glow)]"
      aria-label="Animated Earth logo with location marker"
      role="img"
    />
  );
};

export default EarthLogoWithLocation;
