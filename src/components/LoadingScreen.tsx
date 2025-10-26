import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [healingNodes, setHealingNodes] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 800);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    const healInterval = setInterval(() => {
      setHealingNodes((prev) => (prev < 12 ? prev + 1 : prev));
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(healInterval);
    };
  }, [onComplete]);

  // Node graph positions - degraded Earth fragments
  const nodes = [
    { x: 50, y: 50 }, { x: 150, y: 80 }, { x: 250, y: 50 },
    { x: 50, y: 150 }, { x: 150, y: 180 }, { x: 250, y: 150 },
    { x: 50, y: 250 }, { x: 150, y: 280 }, { x: 250, y: 250 },
    { x: 100, y: 100 }, { x: 200, y: 200 }, { x: 150, y: 220 },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/10 to-accent/10"
      >
        <div className="text-center space-y-12 px-4">
          {/* Node graph healing Earth fragments */}
          <div className="relative w-80 h-80 mx-auto">
            <svg
              className="w-full h-full"
              viewBox="0 0 300 300"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connection lines */}
              {nodes.map((node, i) =>
                nodes.slice(i + 1).map((target, j) => {
                  const isHealed = healingNodes > i + j;
                  return (
                    <motion.line
                      key={`${i}-${j}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHealed ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                      strokeWidth="1"
                      opacity={isHealed ? 0.6 : 0.2}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: isHealed ? 1 : 0.3 }}
                      transition={{ duration: 0.5 }}
                    />
                  );
                })
              )}

              {/* Nodes */}
              {nodes.map((node, i) => {
                const isHealed = healingNodes > i;
                return (
                  <motion.circle
                    key={i}
                    cx={node.x}
                    cy={node.y}
                    r="6"
                    fill={isHealed ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    initial={{ scale: 0 }}
                    animate={{
                      scale: isHealed ? [1, 1.3, 1] : 1,
                      filter: isHealed ? "drop-shadow(0 0 8px hsl(var(--primary)))" : "none",
                    }}
                    transition={{
                      scale: { duration: 0.5, repeat: isHealed ? Infinity : 0, repeatDelay: 1 },
                    }}
                  />
                );
              })}

              {/* Central DataForEarth glyph assembling */}
              <motion.text
                x="150"
                y="160"
                fontSize="32"
                fontWeight="bold"
                fill="hsl(var(--primary))"
                textAnchor="middle"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: progress > 60 ? 1 : 0,
                  scale: progress > 60 ? 1 : 0.5,
                }}
                transition={{ duration: 0.8 }}
              >
                🌍
              </motion.text>
            </svg>
          </div>

          {/* Loading text */}
          <div className="space-y-4">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            >
              DataForEarth
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground text-lg"
            >
              Data mined ethically, profits reinvested.
            </motion.p>
          </div>

          {/* Progress bar */}
          <div className="w-96 mx-auto space-y-3">
            <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-mono">{progress}%</span>
              <span>{healingNodes}/12 nodes healed</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
