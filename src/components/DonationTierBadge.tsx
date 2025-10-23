import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonationTierBadgeProps {
  tier: "sapling" | "young-tree" | "forest-guardian";
  amount: number;
}

const tierInfo = {
  "sapling": {
    name: "Sapling",
    color: "from-green-400 to-emerald-500",
    icon: "🌱",
    minAmount: 5,
  },
  "young-tree": {
    name: "Young Tree",
    color: "from-green-500 to-teal-600",
    icon: "🌳",
    minAmount: 20,
  },
  "forest-guardian": {
    name: "Forest Guardian",
    color: "from-emerald-600 to-green-700",
    icon: "🌲",
    minAmount: 100,
  },
};

export const DonationTierBadge = ({ tier, amount }: DonationTierBadgeProps) => {
  const info = tierInfo[tier];

  const downloadBadge = () => {
    // In production, this would generate a proper badge graphic
    // For now, create a simple canvas badge
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 400, 400);
      gradient.addColorStop(0, "#10b981");
      gradient.addColorStop(1, "#059669");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 400);

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, 360, 360);

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      
      // Tier name
      ctx.font = "bold 40px Arial";
      ctx.fillText(info.name, 200, 150);
      
      // Icon
      ctx.font = "80px Arial";
      ctx.fillText(info.icon, 200, 240);
      
      // Amount
      ctx.font = "bold 30px Arial";
      ctx.fillText(`$${amount} Donated`, 200, 300);
      
      // Footer
      ctx.font = "20px Arial";
      ctx.fillText("Data for Earth", 200, 350);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `dataforearth-${tier}-badge.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className={`bg-gradient-to-br ${info.color} rounded-xl p-8 text-white text-center shadow-2xl border-4 border-white/30`}>
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-6xl mb-4"
        >
          {info.icon}
        </motion.div>
        
        <h3 className="text-3xl font-black mb-2">{info.name}</h3>
        <p className="text-lg font-bold mb-4">${amount} Donated</p>
        <p className="text-sm opacity-90 mb-6">
          Thank you for supporting our environmental mission!
        </p>

        <Button
          onClick={downloadBadge}
          variant="secondary"
          className="w-full font-bold"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Badge
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Share your badge on social media to inspire others!
      </div>
    </motion.div>
  );
};
