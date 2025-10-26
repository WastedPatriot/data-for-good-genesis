import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DataImpactCounter() {
  const [stats, setStats] = useState({
    contributors: 0,
    datasets: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        // Use the public view designed for anonymous access
        const { data, error } = await supabase
          .from('v_public_impact')
          .select('*')
          .single();

        if (error) throw error;

        setStats({
          contributors: Number(data?.total_contributors || 0),
          datasets: Number(data?.total_datasets || 0),
          revenue: Math.floor(Number(data?.total_revenue || 0)),
        });
      } catch (error) {
        console.error('Error fetching public impact stats:', error);
        setStats({ contributors: 0, datasets: 0, revenue: 0 });
      }
    };

    fetchRealStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchRealStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ icon: Icon, value, label, prefix = "" }: { icon: any; value: number; label: string; prefix?: string }) => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className="flex flex-col items-center gap-2"
    >
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative"
      >
        <div className="text-3xl md:text-5xl font-black text-gradient tabular-nums">
          {prefix}{value.toLocaleString()}
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl"
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
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Empowering Badge */}
      <motion.div
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="px-6 py-2 bg-primary/10 border-2 border-primary/30 rounded-full"
      >
        <p className="text-sm md:text-base font-black text-primary uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Real-Time Impact
          <Sparkles className="w-4 h-4" />
        </p>
      </motion.div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-6 md:gap-12">
        <StatCard icon={Users} value={stats.contributors} label="Contributors" />
        <StatCard icon={TrendingUp} value={stats.datasets} label="Datasets" />
        <StatCard icon={Sparkles} value={stats.revenue} label="Impact" prefix="$" />
      </div>

      {/* Empowering Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-muted-foreground text-sm md:text-base max-w-2xl px-4 leading-relaxed"
      >
        Every second, people like you are turning their data into real-world change. 
        <span className="text-primary font-semibold"> Join the movement.</span>
      </motion.p>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-1 bg-card border border-border rounded-full text-xs font-semibold"
        >
          ✓ 100% Transparent
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-1 bg-card border border-border rounded-full text-xs font-semibold"
        >
          ✓ You Choose What to Share
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-1 bg-card border border-border rounded-full text-xs font-semibold"
        >
          ✓ Direct Impact
        </motion.div>
      </div>
    </div>
  );
}
