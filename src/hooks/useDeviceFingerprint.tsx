import { useEffect, useState } from "react";

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      let fingerprintData = "";

      // Screen resolution
      fingerprintData += `${window.screen.width}x${window.screen.height}`;

      // Timezone
      fingerprintData += `-${Intl.DateTimeFormat().resolvedOptions().timeZone}`;

      // Language
      fingerprintData += `-${navigator.language}`;

      // Platform
      fingerprintData += `-${navigator.platform}`;

      // Hardware concurrency
      fingerprintData += `-${navigator.hardwareConcurrency || "unknown"}`;

      // Canvas fingerprint
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("DataForEarth", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("DataForEarth", 4, 17);
        fingerprintData += `-${canvas.toDataURL()}`;
      }

      // Simple hash
      let hash = 0;
      for (let i = 0; i < fingerprintData.length; i++) {
        const char = fingerprintData.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      setFingerprint(Math.abs(hash).toString(36));
    };

    generateFingerprint();
  }, []);

  return fingerprint;
}
