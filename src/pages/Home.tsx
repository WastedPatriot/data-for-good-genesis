import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import WalkingEarth from "@/components/WalkingEarth";
import ScrollingMarquee from "@/components/ScrollingMarquee";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Check your email to confirm your account.",
      });
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-none uppercase">
                STOP BUYING DATA THAT FUNDS GREED.
              </h1>
              
              <p className="text-xl md:text-2xl font-bold mb-8 leading-tight">
                The world's first eSIM that donates 40% of profits to verified climate action. You vote where the money goes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/install">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 w-full sm:w-auto border-2 border-foreground shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase"
                  >
                    Get the App
                  </Button>
                </Link>
                <Button 
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 w-full sm:w-auto border-2 border-foreground shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase"
                  onClick={() => document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Create Account
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <WalkingEarth />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <ScrollingMarquee />

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-center mb-16 uppercase"
          >
            How It Works
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "SELECT",
                description: "Pick a plan for 100+ countries.",
              },
              {
                step: "02",
                title: "INSTALL",
                description: "One-tap activation before you fly.",
              },
              {
                step: "03",
                title: "IMPACT",
                description: "We donate. You track the trees planted in real-time.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border-2 border-foreground p-8 shadow-[4px_4px_0px_0px_#000]"
              >
                <div className="text-6xl font-black mb-4 text-secondary">{item.step}</div>
                <h3 className="text-2xl font-black mb-4 uppercase">{item.title}</h3>
                <p className="text-lg font-bold leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Vote */}
      <section className="py-20 px-4 bg-foreground">
        <div className="container mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black text-center mb-4 text-background uppercase"
          >
            Community Vote
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-background/80 text-xl mb-12 font-bold"
          >
            Live Ballot - Where Your Money Goes
          </motion.p>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { name: "Sungai Watch Indonesia", votes: 42, total: 100 },
              { name: "Amazonia Live Brazil", votes: 31, total: 100 },
              { name: "Ocean Cleanup Initiative", votes: 27, total: 100 },
            ].map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-background border-2 border-background p-6"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-black uppercase">{project.name}</h3>
                  <span className="text-2xl font-black">{project.votes}%</span>
                </div>
                <div className="w-full bg-foreground/20 h-4 border-2 border-foreground">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${project.votes}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    className="bg-secondary h-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section id="signup" className="py-20 px-4">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border-2 border-foreground p-8 shadow-[4px_4px_0px_0px_#000]"
          >
            <h2 className="text-3xl font-black mb-6 uppercase text-center">Create Account</h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="email" className="font-black uppercase">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_#000] font-bold"
                />
              </div>
              <div>
                <Label htmlFor="password" className="font-black uppercase">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_#000] font-bold"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-foreground shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-black uppercase"
              >
                {loading ? "Creating..." : "Sign Up"}
                <ArrowRight className="ml-2" />
              </Button>
            </form>
            <p className="mt-4 text-center font-bold">
              Already have an account?{" "}
              <Link to="/login" className="underline font-black">
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-foreground py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-6 text-sm font-black uppercase">
            <Link to="/about" className="hover:text-secondary transition-colors">
              About
            </Link>
            <Link to="/projects" className="hover:text-secondary transition-colors">
              Projects
            </Link>
            <Link to="/contact" className="hover:text-secondary transition-colors">
              Contact
            </Link>
            <Link to="/privacy" className="hover:text-secondary transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-secondary transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-center mt-6 font-bold">
            © 2025 DataForEarth. Fighting greed, one GB at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
