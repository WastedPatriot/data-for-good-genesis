import { motion } from "framer-motion";
import { Trees, Sprout, Wind, Leaf, Globe } from "lucide-react";

const EarthBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Massive Earth Sphere in Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.25) 25%, rgba(22, 163, 74, 0.15) 50%, rgba(21, 128, 61, 0.08) 70%, transparent 85%)",
          boxShadow: "inset 0 0 150px rgba(34, 197, 94, 0.3), 0 0 150px rgba(34, 197, 94, 0.25), 0 0 300px rgba(34, 197, 94, 0.15)",
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 120,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Continents-like patterns */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`continent-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${60 + Math.random() * 120}px`,
              height: `${40 + Math.random() * 80}px`,
              top: `${Math.random() * 80}%`,
              left: `${Math.random() * 80}%`,
              background: "rgba(22, 163, 74, 0.3)",
              boxShadow: "0 0 20px rgba(34, 197, 94, 0.2)",
            }}
            animate={{
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Orbiting Globe Icons */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`orbit-globe-${i}`}
          className="absolute top-1/2 left-1/2"
          style={{
            width: `${500 + i * 150}px`,
            height: `${500 + i * 150}px`,
            marginLeft: `-${250 + i * 75}px`,
            marginTop: `-${250 + i * 75}px`,
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 40 + i * 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Globe className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-primary/40" />
        </motion.div>
      ))}

      {/* Growing Forest Elements - More Abundant */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`tree-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${Math.random() * 40}%`,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [30, -20, -50],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        >
          <Trees className="w-6 h-6 text-green-500/50" />
        </motion.div>
      ))}

      {/* Growing Sprouts - Scattered */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`sprout-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.5, 0],
            rotate: [0, 15, -15, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut",
          }}
        >
          <Sprout className="w-5 h-5 text-green-400/60" />
        </motion.div>
      ))}

      {/* Wind Flow Effects */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`wind-${i}`}
          className="absolute"
          style={{
            right: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [-30, 150],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeInOut",
          }}
        >
          <Wind className="w-10 h-10 text-primary/30" />
        </motion.div>
      ))}

      {/* Floating Leaves - Everywhere */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, 360],
            opacity: [0, 0.5, 0],
            x: [0, Math.random() * 40 - 20],
          }}
          transition={{
            duration: 12 + Math.random() * 8,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        >
          <Leaf className="w-4 h-4 text-green-400/40" />
        </motion.div>
      ))}

      {/* Pulsing Energy Rings Around Earth */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/20"
          style={{
            width: `${400 + i * 100}px`,
            height: `${400 + i * 100}px`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default EarthBackground;
