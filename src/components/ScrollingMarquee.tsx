import { motion } from "framer-motion";

const ScrollingMarquee = () => {
  const text = "⚡ NO ROAMING FEES ⚡ 40% PROFITS DONATED ⚡ CONTRACT-FREE ⚡ ";
  const repeatedText = text.repeat(10);

  return (
    <div className="w-full overflow-hidden bg-foreground py-4 border-y-2 border-border">
      <motion.div
        className="whitespace-nowrap"
        animate={{
          x: [0, -1000],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <span className="text-2xl md:text-3xl font-black text-background uppercase tracking-wider">
          {repeatedText}
        </span>
      </motion.div>
    </div>
  );
};

export default ScrollingMarquee;
