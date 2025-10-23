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
      duration: 4000,
    },
    {
      title: "Big Tech Profits",
      subtitle: "Billions made from your information",
      icon: DollarSign,
      duration: 4000,
    },
    {
      title: "Earth Pays the Price",
      subtitle: "Exploitation without accountability",
      icon: Factory,
      duration: 4000,
    },
    {
      title: "You Have the Power",
      subtitle: "Transform data into environmental action",
      icon: Sprout,
      duration: 4000,
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute inset-0 flex flex-col items-center justify-center px-8"
      >
        {/* Background gradient effect */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 30% 50%, hsl(145 70% 50% / 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 70% 50%, hsl(165 75% 45% / 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 30%, hsl(145 70% 50% / 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Icon animation */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
          className="relative mb-8"
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-32 h-32 rounded-full bg-primary/30 blur-2xl" />
          </motion.div>

          {/* Icon */}
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Icon className="w-20 h-20 text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center z-10"
        >
          <h3 className="text-3xl font-black text-gradient mb-3 leading-tight">
            {scene.title}
          </h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-muted-foreground font-medium leading-relaxed"
          >
            {scene.subtitle}
          </motion.p>
        </motion.div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            initial={{
              x: Math.random() * 260 - 130,
              y: Math.random() * 400 - 200,
              opacity: 0,
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Scene-specific animations */}
        {sceneIndex === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full"
                animate={{
                  x: [0, Math.cos((i * Math.PI * 2) / 8) * 80],
                  y: [0, Math.sin((i * Math.PI * 2) / 8) * 80],
                  opacity: [1, 0],
                  scale: [1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>
        )}

        {sceneIndex === 1 && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{
                  x: Math.random() * 200 - 100,
                  y: 300,
                  opacity: 0,
                }}
                animate={{
                  y: -50,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear",
                }}
              >
                💰
              </motion.div>
            ))}
          </>
        )}

        {sceneIndex === 2 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-1 bg-red-500/50"
                style={{
                  transform: `rotate(${(i * 360) / 6}deg)`,
                }}
              />
            ))}
          </motion.div>
        )}

        {sceneIndex === 3 && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-3xl"
                initial={{
                  x: Math.cos((i * Math.PI * 2) / 8) * 120,
                  y: Math.sin((i * Math.PI * 2) / 8) * 120,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  x: Math.cos((i * Math.PI * 2) / 8) * 60,
                  y: Math.sin((i * Math.PI * 2) / 8) * 60,
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: i * 0.1,
                  ease: "easeInOut",
                }}
              >
                🌱
              </motion.div>
            ))}
          </>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-background via-background to-background/95 overflow-hidden">
      {/* Animated scenes */}
      <AnimatePresence mode="wait">
        <Scene key={currentScene} sceneIndex={currentScene} />
      </AnimatePresence>

      {/* Progress dots */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
        {scenes.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentScene
                ? "bg-primary w-8"
                : "bg-muted-foreground/30 w-2"
            }`}
            animate={{
              scale: index === currentScene ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DataStoryAnimation;
