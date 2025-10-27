import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, MousePointer2, Eye, Share2, DollarSign, TrendingUp, AlertTriangle, Shield } from "lucide-react";

const DataHarvestAnimation: React.FC = () => {
  const [currentScene, setCurrentScene] = useState(0);

  const scenes = [
    {
      id: "intro",
      duration: 4000,
      title: "Your Digital Life",
      subtitle: "Every moment online creates data",
    },
    {
      id: "collection",
      duration: 5000,
      title: "Invisible Collection",
      subtitle: "They're watching everything you do",
    },
    {
      id: "transmission",
      duration: 4000,
      title: "Data Harvesting",
      subtitle: "Your information flows to tech giants",
    },
    {
      id: "profit",
      duration: 4000,
      title: "Billion Dollar Business",
      subtitle: "Your data = Their massive profits",
    },
    {
      id: "solution",
      duration: 5000,
      title: "Take Back Control",
      subtitle: "Make your data work for the planet",
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentScene((prev) => (prev + 1) % scenes.length);
    }, scenes[currentScene].duration);

    return () => clearTimeout(timer);
  }, [currentScene]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScene === 0 && <IntroScene key="intro" />}
        {currentScene === 1 && <CollectionScene key="collection" />}
        {currentScene === 2 && <TransmissionScene key="transmission" />}
        {currentScene === 3 && <ProfitScene key="profit" />}
        {currentScene === 4 && <SolutionScene key="solution" />}
      </AnimatePresence>

      {/* Title overlay */}
      <motion.div
        key={`title-${currentScene}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-16 left-0 right-0 px-8 z-20 text-center"
      >
        <h3 className="text-2xl font-black mb-2 text-gradient">
          {scenes[currentScene].title}
        </h3>
        <p className="text-sm text-muted-foreground font-medium">
          {scenes[currentScene].subtitle}
        </p>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute bottom-6 left-0 right-0 px-8 z-20">
        <div className="flex justify-center gap-2">
          {scenes.map((_, index) => (
            <motion.div
              key={index}
              className="h-1 rounded-full bg-primary/30"
              style={{ width: index === currentScene ? 32 : 8 }}
              animate={{ width: index === currentScene ? 32 : 8 }}
            >
              {index === currentScene && (
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: scenes[index].duration / 1000, ease: "linear" }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scene 1: Person using phone
const IntroScene = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    {/* Background glow */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          "radial-gradient(circle at 50% 50%, hsl(142 86% 45% / 0.1) 0%, transparent 60%)",
          "radial-gradient(circle at 50% 50%, hsl(191 92% 50% / 0.1) 0%, transparent 60%)",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
    />

    {/* Phone mockup */}
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative"
    >
      <div className="w-32 h-64 bg-card rounded-3xl border-4 border-foreground/20 shadow-2xl relative overflow-hidden">
        {/* Phone screen */}
        <div className="absolute inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl overflow-hidden">
          {/* Scrolling content simulation */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="h-8 bg-foreground/10 rounded-lg mx-2 my-2"
              initial={{ y: -300 }}
              animate={{ y: 300 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "linear",
              }}
            />
          ))}
        </div>
        
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/20 rounded-b-2xl" />
      </div>

      {/* Finger tap indicators */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
          }}
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
          }}
        >
          <MousePointer2 className="w-6 h-6 text-accent" />
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
);

// Scene 2: Data being collected from every action
const CollectionScene = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    {/* Center phone */}
    <div className="relative">
      <motion.div
        animate={{ rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-32 h-64 bg-card rounded-3xl border-4 border-destructive/40 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-2 bg-gradient-to-br from-destructive/20 to-destructive/5 rounded-2xl" />
        <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-destructive/40" />
      </motion.div>

      {/* Eyes watching from all directions */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 360) / 12;
        const radius = 100;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
            }}
            initial={{
              x: Math.cos((angle * Math.PI) / 180) * radius - 16,
              y: Math.sin((angle * Math.PI) / 180) * radius - 16,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              opacity: [0, 1, 1],
              scale: [0, 1.2, 1],
            }}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <Eye className="w-8 h-8 text-destructive" />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Data particles being extracted */}
      {[...Array(30)].map((_, i) => {
        const angle = (i * 360) / 30;
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-destructive"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [0, Math.cos((angle * Math.PI) / 180) * 120],
              y: [0, Math.sin((angle * Math.PI) / 180) * 120],
              opacity: [1, 0],
              scale: [1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  </motion.div>
);

// Scene 3: Data flowing to servers
const TransmissionScene = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex flex-col items-center justify-center gap-20"
  >
    {/* User phone at bottom */}
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      <div className="w-20 h-40 bg-card rounded-2xl border-2 border-primary/40 shadow-xl flex items-center justify-center">
        <Smartphone className="w-10 h-10 text-primary" />
      </div>
    </motion.div>

    {/* Data streams flowing upward */}
    <div className="absolute top-48 left-1/2 -translate-x-1/2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ left: `${-20 + i * 10}px` }}
        >
          {[...Array(10)].map((_, j) => (
            <motion.div
              key={j}
              className="w-1.5 h-1.5 rounded-full bg-accent absolute"
              initial={{ y: 0, opacity: 0 }}
              animate={{
                y: -200,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.1 + j * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>

    {/* Server/Building at top */}
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="relative"
    >
      <motion.div
        animate={{
          boxShadow: [
            "0 0 20px hsl(191 92% 50% / 0.3)",
            "0 0 40px hsl(191 92% 50% / 0.6)",
            "0 0 20px hsl(191 92% 50% / 0.3)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-24 h-16 bg-accent/20 border-2 border-accent rounded-lg grid grid-cols-3 gap-1 p-2"
      >
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            className="bg-accent/40 rounded-sm"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
      <Share2 className="absolute -top-3 -right-3 w-6 h-6 text-accent" />
    </motion.div>
  </motion.div>
);

// Scene 4: Companies making billions
const ProfitScene = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    {/* Money background */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          "radial-gradient(circle at 50% 50%, hsl(48 100% 50% / 0.1) 0%, transparent 60%)",
          "radial-gradient(circle at 50% 50%, hsl(48 100% 50% / 0.2) 0%, transparent 60%)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    />

    {/* Central dollar sign */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <DollarSign className="w-32 h-32 text-yellow-400" strokeWidth={3} />
      </motion.div>

      {/* Orbiting money symbols */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 360) / 8;
        const radius = 80;
        return (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * radius - 16,
                Math.cos(((angle + 360) * Math.PI) / 180) * radius - 16,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * radius - 16,
                Math.sin(((angle + 360) * Math.PI) / 180) * radius - 16,
              ],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            💰
          </motion.div>
        );
      })}
    </motion.div>

    {/* Rising trend line */}
    <motion.div
      className="absolute bottom-20 right-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <TrendingUp className="w-16 h-16 text-yellow-400" strokeWidth={3} />
    </motion.div>

    {/* Money rain */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-lg"
        style={{
          left: `${Math.random() * 100}%`,
        }}
        initial={{ y: -50, opacity: 0, rotate: 0 }}
        animate={{
          y: 600,
          opacity: [0, 1, 1, 0],
          rotate: Math.random() * 360,
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "linear",
        }}
      >
        💵
      </motion.div>
    ))}
  </motion.div>
);

// Scene 5: The solution - take control
const SolutionScene = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 flex items-center justify-center"
  >
    {/* Green glow background */}
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          "radial-gradient(circle at 50% 50%, hsl(142 86% 45% / 0.2) 0%, transparent 60%)",
          "radial-gradient(circle at 50% 50%, hsl(142 86% 45% / 0.3) 0%, transparent 60%)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    />

    {/* Shield with growing plants */}
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      className="relative"
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Shield className="w-32 h-32 text-primary" strokeWidth={2.5} fill="hsl(142 86% 45% / 0.1)" />
      </motion.div>

      {/* Growing plants inside shield */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: "50%",
            top: "50%",
            x: "-50%",
            y: "-50%",
          }}
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: [0, 1, 1],
            y: [20, -10, 0],
          }}
          transition={{
            delay: 0.5 + i * 0.15,
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          🌱
        </motion.div>
      ))}
    </motion.div>

    {/* Orbiting positive elements */}
    {[
      { icon: "🌍", angle: 0 },
      { icon: "♻️", angle: 90 },
      { icon: "🌳", angle: 180 },
      { icon: "💚", angle: 270 },
    ].map((item, i) => {
      const radius = 90;
      return (
        <motion.div
          key={i}
          className="absolute text-3xl"
          style={{
            left: "50%",
            top: "50%",
          }}
          initial={{
            x: Math.cos((item.angle * Math.PI) / 180) * radius - 20,
            y: Math.sin((item.angle * Math.PI) / 180) * radius - 20,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: [
              Math.cos((item.angle * Math.PI) / 180) * radius - 20,
              Math.cos(((item.angle + 360) * Math.PI) / 180) * radius - 20,
            ],
            y: [
              Math.sin((item.angle * Math.PI) / 180) * radius - 20,
              Math.sin(((item.angle + 360) * Math.PI) / 180) * radius - 20,
            ],
            scale: [0, 1, 1],
            opacity: [0, 1, 1],
          }}
          transition={{
            scale: { delay: 0.3 + i * 0.1, duration: 0.5 },
            opacity: { delay: 0.3 + i * 0.1, duration: 0.5 },
            x: { duration: 10, repeat: Infinity, ease: "linear" },
            y: { duration: 10, repeat: Infinity, ease: "linear" },
          }}
        >
          {item.icon}
        </motion.div>
      );
    })}

    {/* Sparkles */}
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-primary text-xl"
        style={{
          left: `${20 + Math.random() * 60}%`,
          top: `${20 + Math.random() * 60}%`,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1.5, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      >
        ✨
      </motion.div>
    ))}
  </motion.div>
);

export default DataHarvestAnimation;