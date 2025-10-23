import React from "react";
import { motion } from "framer-motion";

interface PhoneMockupProps {
  children: React.ReactNode;
}

const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative mx-auto"
      style={{ width: "280px", height: "570px" }}
    >
      {/* Phone frame */}
      <div className="absolute inset-0 bg-card rounded-[3rem] border-[12px] border-foreground/90 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-foreground/90 rounded-b-3xl z-10" />
        
        {/* Screen content */}
        <div className="absolute inset-0 bg-background overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* Power button */}
      <div className="absolute right-[-4px] top-24 w-1 h-16 bg-foreground/80 rounded-l" />
      
      {/* Volume buttons */}
      <div className="absolute left-[-4px] top-20 w-1 h-8 bg-foreground/80 rounded-r" />
      <div className="absolute left-[-4px] top-32 w-1 h-8 bg-foreground/80 rounded-r" />
    </motion.div>
  );
};

export default PhoneMockup;
