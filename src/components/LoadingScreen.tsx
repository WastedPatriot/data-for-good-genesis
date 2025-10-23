import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Droplet, Sun, Wind } from "lucide-react";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(0);

  const icons = [
    { Icon: Leaf, label: "Loading ecosystem data...", color: "text-green-500" },
    { Icon: Droplet, label: "Connecting to water sources...", color: "text-blue-500" },
    { Icon: Sun, label: "Capturing solar energy...", color: "text-yellow-500" },
    { Icon: Wind, label: "Analyzing air quality...", color: "text-cyan-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(iconInterval);
    };
  }, [onComplete]);

  const CurrentIcon = icons[currentIcon].Icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5"
      >
        <div className="text-center space-y-8 px-4">
          {/* Animated Earth-like orb */}
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-primary via-accent to-primary/50 
                       shadow-[0_0_60px_rgba(var(--primary),0.6)] relative overflow-hidden"
          >
            {/* Earth texture overlay */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.3),transparent_50%)]" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_60%,rgba(0,0,0,0.2),transparent_50%)]" />
            
            {/* Rotating icon in center */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CurrentIcon className={`w-12 h-12 ${icons[currentIcon].color}`} />
            </motion.div>
          </motion.div>

          {/* Loading text */}
          <div className="space-y-3">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-gradient"
            >
              DataForEarth
            </motion.h1>
            
            <motion.p
              key={currentIcon}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-muted-foreground h-6"
            >
              {icons[currentIcon].label}
            </motion.p>
          </div>

          {/* Progress bar */}
          <div className="w-64 mx-auto space-y-2">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {progress}%
            </p>
          </div>

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
