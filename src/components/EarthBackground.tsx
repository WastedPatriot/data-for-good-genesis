import { motion } from "framer-motion";
import { Trees, Sprout, Wind, Leaf, Globe } from "lucide-react";

const EarthBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Massive Earth Sphere in Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 35%, #3b82f6 0%, #1e40af 20%, #0c4a6e 35%, #134e4a 50%, #065f46 65%, rgba(21, 128, 61, 0.4) 85%, transparent 100%)",
          boxShadow: "inset -80px -80px 200px rgba(0, 0, 0, 0.8), inset 80px 80px 150px rgba(59, 130, 246, 0.3), 0 0 200px rgba(34, 197, 94, 0.5), 0 0 400px rgba(34, 197, 94, 0.3)",
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
        {/* Continents with forests */}
        {[...Array(20)].map((_, i) => {
          const size = 80 + Math.random() * 150;
          const top = 10 + Math.random() * 70;
          const left = 10 + Math.random() * 70;
          return (
            <motion.div
              key={`continent-${i}`}
              className="absolute"
              style={{
                width: `${size}px`,
                height: `${size * 0.6}px`,
                top: `${top}%`,
                left: `${left}%`,
                background: `linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.8), rgba(21, 128, 61, 0.7))`,
                borderRadius: `${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}%`,
                boxShadow: "inset -2px -2px 10px rgba(0, 0, 0, 0.3), 0 2px 15px rgba(34, 197, 94, 0.4)",
              }}
              animate={{
                opacity: [0.8, 0.95, 0.8],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Forest dots on continents */}
              {[...Array(8)].map((_, j) => (
                <div
                  key={`forest-${i}-${j}`}
                  className="absolute rounded-full bg-green-600/60"
                  style={{
                    width: `${4 + Math.random() * 6}px`,
                    height: `${4 + Math.random() * 6}px`,
                    top: `${Math.random() * 80}%`,
                    left: `${Math.random() * 80}%`,
                  }}
                />
              ))}
            </motion.div>
          );
        })}

        {/* Ocean patterns - wavy blue areas */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`ocean-${i}`}
            className="absolute"
            style={{
              width: `${100 + Math.random() * 150}px`,
              height: `${60 + Math.random() * 100}px`,
              top: `${Math.random() * 70}%`,
              left: `${Math.random() * 70}%`,
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.6), rgba(30, 64, 175, 0.4))",
              borderRadius: `${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}%`,
              filter: "blur(8px)",
            }}
            animate={{
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6 + i * 1.5,
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
