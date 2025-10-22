import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, Download } from "lucide-react";

const ClaimBadge = () => {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = () => {
    // This will be connected to Supabase to verify codes
    if (code.length > 0) {
      setVerified(true);
      setError("");
    } else {
      setError("Please enter a valid code");
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary to-primary/60 rounded-full p-8">
                <Badge className="w-24 h-24 text-background" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl font-bold mb-4">
              You're Officially an Ethical Data Buyer! 🌿
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Display your badge proudly on your website
            </p>

            <div className="bg-card border border-border rounded-lg p-8 mb-6">
              <h3 className="font-bold mb-4">Download Badge</h3>
              <div className="flex gap-4 justify-center">
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  PNG Image
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  SVG Image
                </Button>
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-6 text-left">
              <h3 className="font-bold mb-3">HTML Embed Code</h3>
              <pre className="text-sm bg-background p-4 rounded overflow-x-auto">
                <code>{`<a href="https://dataforearth.org/verify?code=${code}">
  <img src="badge.png" alt="Ethical Data Partner" />
</a>`}</code>
              </pre>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Badge className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Claim Your Badge</h1>
          <p className="text-muted-foreground">
            Enter your unique Ethical Code to claim your badge
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ethical Code
              </label>
              <Input
                type="text"
                placeholder="Enter your code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg tracking-wider"
              />
              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
            </div>

            <Button className="w-full" onClick={handleVerify}>
              Verify & Claim Badge
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Don't have a code?{" "}
              <a href="/marketplace" className="text-primary hover:underline">
                Purchase a dataset
              </a>{" "}
              to receive one via email
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ClaimBadge;