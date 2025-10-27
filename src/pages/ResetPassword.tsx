import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the user landed here from the email link, Supabase sets a recovery session
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setStage("reset");
    });
  }, []);

  const requestReset = async () => {
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Reset link sent. Check your inbox.");
      navigate("/login");
    } catch (e: any) {
      toast.error(e.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!password || password.length < 6) return toast.error("Password too short");
    if (password !== confirm) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You can log in now.");
      navigate("/login");
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{stage === "reset" ? "Set a new password" : "Forgot password"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stage === "request" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button className="w-full" disabled={loading} onClick={requestReset}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button className="w-full" disabled={loading} onClick={submitNewPassword}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
