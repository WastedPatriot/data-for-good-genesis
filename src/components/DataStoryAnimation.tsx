import React, { useEffect, useRef, useState } from "react";

const DataStoryAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const animationRef = useRef<number>();

  const scenes = [
    {
      title: "Your Data",
      subtitle: "is being collected",
      duration: 3000,
    },
    {
      title: "Tech Giants",
      subtitle: "profit billions",
      duration: 3000,
    },
    {
      title: "Earth Suffers",
      subtitle: "from exploitation",
      duration: 3000,
    },
    {
      title: "Now You Choose",
      subtitle: "data for earth",
      duration: 3000,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, scenes[currentScene].duration);

    return () => clearInterval(interval);
  }, [currentScene, scenes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }> = [];

    // Create pixel earth particles
    const createEarth = () => {
      particles = [];
      const centerX = width / 2;
      const centerY = height / 3;
      const radius = 60;

      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        for (let r = 0; r < radius; r += 8) {
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const isLand = Math.random() > 0.6;
          
          particles.push({
            x,
            y,
            vx: 0,
            vy: 0,
            size: 4,
            color: isLand ? "#22c55e" : "#3b82f6",
          });
        }
      }
    };

    // Animation loop
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);

      // Scene-specific animations
      if (currentScene === 0) {
        // Data collection - particles flow from earth
        particles.forEach((p) => {
          p.vy = Math.random() * 2 - 1;
          p.vx = Math.random() * 2 - 1;
          p.x += p.vx;
          p.y += p.vy;

          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      } else if (currentScene === 1) {
        // Tech giants profit - particles cluster at top
        particles.forEach((p) => {
          const targetY = height * 0.2;
          p.vy = (targetY - p.y) * 0.02;
          p.vx = (width / 2 - p.x) * 0.02;
          p.x += p.vx;
          p.y += p.vy;

          ctx.fillStyle = "#ef4444";
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      } else if (currentScene === 2) {
        // Earth suffers - particles scatter and fade
        particles.forEach((p) => {
          p.vx = (Math.random() - 0.5) * 4;
          p.vy = Math.random() * 3;
          p.x += p.vx;
          p.y += p.vy;

          ctx.fillStyle = "#78716c";
          ctx.fillRect(p.x, p.y, p.size, p.size);
        });
      } else if (currentScene === 3) {
        // You choose - particles reform earth with glow
        particles.forEach((p) => {
          const centerX = width / 2;
          const centerY = height / 3;
          p.vx = (centerX - p.x) * 0.05;
          p.vy = (centerY - p.y) * 0.05;
          p.x += p.vx;
          p.y += p.vy;

          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.shadowBlur = 0;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    createEarth();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentScene]);

  return (
    <div className="relative w-full h-full bg-background flex flex-col items-center justify-center">
      {/* Canvas for pixel earth animation */}
      <canvas
        ref={canvasRef}
        width={280}
        height={400}
        className="absolute inset-0"
      />

      {/* Text overlay */}
      <div className="absolute bottom-20 left-0 right-0 px-6 text-center z-10">
        <h3 className="text-2xl font-black text-gradient mb-2">
          {scenes[currentScene].title}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {scenes[currentScene].subtitle}
        </p>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
        {scenes.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentScene
                ? "bg-primary w-6"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DataStoryAnimation;
