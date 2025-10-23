import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DoomsdayCountdown: React.FC = () => {
  // Climate scientists estimate we have until ~2030 to limit warming to 1.5°C
  // Using January 1, 2030 as the symbolic deadline
  const doomsdayDate = new Date("2030-01-01T00:00:00Z");
  
  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = doomsdayDate.getTime() - now.getTime();

      if (difference > 0) {
        const seconds = Math.floor(difference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const years = Math.floor(days / 365);

        setTimeLeft({
          years,
          days: days % 365,
          hours: hours % 24,
          minutes: minutes % 60,
          seconds: seconds % 60,
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      <motion.div
        key={value}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        <div className="text-4xl md:text-6xl font-black text-gradient glow-text tabular-nums">
          {value.toString().padStart(2, "0")}
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      <div className="text-xs md:text-sm text-muted-foreground font-bold uppercase tracking-wider mt-1">
        {label}
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Warning label */}
      <motion.div
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="px-6 py-2 bg-destructive/20 border-2 border-destructive/50 rounded-full"
      >
        <p className="text-sm md:text-base font-black text-destructive uppercase tracking-wider">
          ⚠️ Climate Emergency
        </p>
      </motion.div>

      {/* Countdown */}
      <div className="flex gap-4 md:gap-8">
        <TimeUnit value={timeLeft.years} label="Years" />
        <div className="text-4xl md:text-6xl font-black text-gradient self-center">:</div>
        <TimeUnit value={timeLeft.days} label="Days" />
        <div className="text-4xl md:text-6xl font-black text-gradient self-center">:</div>
        <TimeUnit value={timeLeft.hours} label="Hours" />
      </div>

      <div className="flex gap-4 md:gap-6">
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <div className="text-3xl md:text-4xl font-black text-gradient self-center">:</div>
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-sm md:text-base max-w-md px-4"
      >
        Time remaining to limit warming to 1.5°C and prevent irreversible climate collapse
      </motion.p>
    </div>
  );
};

export default DoomsdayCountdown;
