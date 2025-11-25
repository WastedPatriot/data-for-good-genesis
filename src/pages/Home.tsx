import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalkingEarth from "@/components/WalkingEarth";
import CountdownTimer from "@/components/CountdownTimer";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

const Home = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [joined, setJoined] = useState(false);
  const { toast } = useToast();
  const { width, height } = useWindowSize();

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('data_submissions')
      .insert([{ email }]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setShowConfetti(true);
      setJoined(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast({
        title: "YOU'RE IN!",
        description: "Check your email for updates.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {showConfetti && <Confetti width={width} height={height} />}
      
      {/* Section A: Hero Countdown */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-7xl lg:text-8xl font-black text-center mb-8 uppercase tracking-tighter"
        >
          THE OLD TELECOM MODEL DIES IN:
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <CountdownTimer />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl md:text-4xl font-black text-center uppercase"
        >
          DataForEarth. 40% Profits to the Planet.
        </motion.p>
      </section>

      {/* Section B: Mascot */}
      <section className="py-20 px-4 bg-foreground">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <WalkingEarth />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <h2 className="text-4xl md:text-6xl font-black text-background uppercase mb-4">
              JOIN THE REVOLUTION
            </h2>
            <p className="text-xl md:text-2xl font-bold text-background/90">
              Ethical data. Real impact. No more greed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Section C: Join Form */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {!joined ? (
              <form onSubmit={handleWaitlistSignup} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ENTER YOUR EMAIL"
                    required
                    className="flex-1 h-16 text-xl font-black border-4 border-foreground shadow-[6px_6px_0px_0px_#000000] placeholder:text-foreground/50 uppercase"
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-16 px-12 text-xl font-black uppercase bg-secondary text-secondary-foreground border-4 border-foreground shadow-[6px_6px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#000000] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
                  >
                    {loading ? "JOINING..." : "JOIN THE WAITLIST"}
                  </Button>
                </div>
                <p className="text-center text-sm md:text-base font-bold">
                  Join 5,402 others waiting for ethical data.
                </p>
              </form>
            ) : (
              <div className="text-center bg-secondary text-secondary-foreground p-8 border-4 border-foreground shadow-[6px_6px_0px_0px_#000000]">
                <h3 className="text-3xl md:text-5xl font-black uppercase mb-4">YOU'RE IN!</h3>
                <p className="text-xl font-bold">REFER A FRIEND TO JUMP THE QUEUE.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Section D: Manifesto Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-center mb-12 uppercase tracking-tighter"
          >
            THE DATAFOREARTH MANIFESTO
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "⚡", title: "ZERO ROAMING FEES", desc: "Travel anywhere without the shock bill." },
              { icon: "🌍", title: "COMMUNITY VOTING", desc: "You decide which projects get funded." },
              { icon: "🛡️", title: "BUILT-IN VPN", desc: "Your data stays private. Always." },
              { icon: "💰", title: "CRYPTO PAYMENT", desc: "Pay with Bitcoin, Ethereum, or USDC." },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-8 border-4 border-foreground shadow-[6px_6px_0px_0px_#000000]"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-black mb-2 uppercase">{item.title}</h3>
                <p className="text-base font-bold">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-foreground py-8 px-4 bg-foreground text-background">
        <div className="container mx-auto text-center">
          <p className="text-sm font-black uppercase">
            © 2025 DataForEarth. Fighting greed, one GB at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
