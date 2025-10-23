import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, DollarSign, Factory, Sprout } from "lucide-react";

const DataStoryAnimation: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);

  const scenes = [
    {
      title: "Your Data",
      subtitle: "Every click. Every scroll. Every moment.",
      icon: Users,
      color: "#3b82f6",
      duration: 5000,
    },
    {
      title: "Big Tech Profits",
      subtitle: "Billions made from your information",
      icon: DollarSign,
      color: "#eab308",
      duration: 5000,
    },
    {
      title: "Earth Pays the Price",
      subtitle: "Exploitation without accountability",
      icon: Factory,
      color: "#ef4444",
      duration: 5000,
    },
    {
      title: "You Have the Power",
      subtitle: "Transform data into environmental action",
      icon: Sprout,
      color: "#22c55e",
      duration: 5000,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, scenes[currentScene].duration);

    return () => clearInterval(interval);
  }, [currentScene]);

  const Scene = ({ sceneIndex }: { sceneIndex: number }) => {
    const scene = scenes[sceneIndex];
    const Icon = scene.icon;

    return (
      <motion.div
        key={sceneIndex}
        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 1.1, rotateY: 15 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.43, 0.13, 0.23, 0.96]
        }}
        className="absolute inset-0 flex flex-col items-center justify-center px-8 overflow-hidden"
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${scene.color}40 0%, transparent 60%)`,
              `radial-gradient(circle at 80% 50%, ${scene.color}40 0%, transparent 60%)`,
              `radial-gradient(circle at 50% 20%, ${scene.color}40 0%, transparent 60%)`,
              `radial-gradient(circle at 20% 50%, ${scene.color}40 0%, transparent 60%)`,
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Cinematic light rays */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(45deg, transparent 30%, ${scene.color}15 50%, transparent 70%)`,
          }}
          animate={{
            rotate: [0, 360],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        {/* Main icon with advanced animations */}
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ 
            delay: 0.3, 
            duration: 1, 
            ease: [0.34, 1.56, 0.64, 1]
          }}
          className="relative mb-10 z-10"
        >
          {/* Multiple glow layers */}
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div 
              className="w-32 h-32 rounded-full blur-3xl"
              style={{ backgroundColor: `${scene.color}60` }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.2, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div 
              className="w-32 h-32 rounded-full blur-2xl"
              style={{ backgroundColor: `${scene.color}40` }}
            />
          </motion.div>

          {/* Icon with micro animations */}
          <motion.div
            animate={{ 
              rotate: [0, 3, -3, 0],
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut",
              repeatType: "reverse"
            }}
            className="relative z-10"
          >
            <Icon 
              className="w-24 h-24 relative z-10" 
              style={{ 
                color: scene.color,
                filter: `drop-shadow(0 0 20px ${scene.color}80)`
              }}
            />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="text-center z-10 space-y-3"
        >
          <motion.h3 
            className="text-3xl font-black leading-tight px-4"
            style={{ 
              background: `linear-gradient(135deg, ${scene.color}, ${scene.color}80)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {scene.title}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-sm text-muted-foreground font-medium leading-relaxed px-6"
          >
            {scene.subtitle}
          </motion.p>
        </motion.div>

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => {
          const angle = (i * 360) / 12;
          const radius = 80 + Math.random() * 60;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + Math.random() * 5,
                height: 3 + Math.random() * 5,
                backgroundColor: scene.color,
                filter: `blur(${1 + Math.random()}px)`,
              }}
              initial={{
                x: Math.cos((angle * Math.PI) / 180) * radius,
                y: Math.sin((angle * Math.PI) / 180) * radius,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                x: [
                  Math.cos((angle * Math.PI) / 180) * radius,
                  Math.cos(((angle + 30) * Math.PI) / 180) * (radius + 20),
                  Math.cos((angle * Math.PI) / 180) * radius,
                ],
                y: [
                  Math.sin((angle * Math.PI) / 180) * radius,
                  Math.sin(((angle + 30) * Math.PI) / 180) * (radius - 40),
                  Math.sin((angle * Math.PI) / 180) * radius,
                ],
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Scene-specific effects */}
        {sceneIndex === 0 && <DataCollectionEffect color={scene.color} />}
        {sceneIndex === 1 && <MoneyRainEffect />}
        {sceneIndex === 2 && <FactorySmokeEffect />}
        {sceneIndex === 3 && <GrowthEffect color={scene.color} />}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-background via-background/98 to-background overflow-hidden">
      <AnimatePresence mode="wait">
        <Scene key={currentScene} sceneIndex={currentScene} />
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-0 right-0 px-8 z-20">
        <div className="flex justify-center gap-2">
          {scenes.map((scene, index) => (
            <motion.div
              key={index}
              className="relative h-1 rounded-full overflow-hidden"
              style={{
                width: index === currentScene ? 40 : 8,
                backgroundColor: `${scene.color}30`,
              }}
              animate={{
                width: index === currentScene ? 40 : 8,
              }}
              transition={{ duration: 0.3 }}
            >
              {index === currentScene && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: scene.color, transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ 
                    duration: scene.duration / 1000,
                    ease: "linear"
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Effect components
const DataCollectionEffect = ({ color }: { color: string }) => (
  <>
    {[...Array(16)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          x: [0, Math.cos((i * Math.PI * 2) / 16) * 100],
          y: [0, Math.sin((i * Math.PI * 2) / 16) * 100],
          opacity: [1, 0],
          scale: [1, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: i * 0.1,
          ease: "easeOut",
        }}
      />
    ))}
  </>
);

const MoneyRainEffect = () => (
  <>
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-xl"
        style={{
          left: `${Math.random() * 100}%`,
        }}
        initial={{
          y: -50,
          opacity: 0,
          rotate: 0,
        }}
        animate={{
          y: 500,
          opacity: [0, 1, 1, 0],
          rotate: Math.random() * 360,
        }}
        transition={{
          duration: 4 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.3,
          ease: "linear",
        }}
      >
        💰
      </motion.div>
    ))}
  </>
);

const FactorySmokeEffect = () => (
  <>
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-gray-500/30 blur-xl"
        style={{
          width: 60 + Math.random() * 40,
          height: 60 + Math.random() * 40,
          left: `${20 + i * 10}%`,
          bottom: 100,
        }}
        animate={{
          y: [-100, -250],
          opacity: [0.6, 0],
          scale: [1, 1.5],
        }}
        transition={{
          duration: 5 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeOut",
        }}
      />
    ))}
  </>
);

const GrowthEffect = ({ color }: { color: string }) => (
  <>
    {[...Array(12)].map((_, i) => {
      const angle = (i * 360) / 12;
      return (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: Math.cos((angle * Math.PI) / 180) * 80,
            y: Math.sin((angle * Math.PI) / 180) * 80,
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        >
          🌱
        </motion.div>
      );
    })}
  </>
);

export default DataStoryAnimation;
