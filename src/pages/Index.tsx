import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

/**
 * Index - Smart Landing Page
 * 
 * Detects platform and routes users:
 * - Native iOS/Android → /esim (eSIM app)
 * - Web → /home (DataForEarth marketplace)
 */
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Native mobile app - show eSIM app
      navigate("/esim", { replace: true });
    } else {
      // Web browser - show app install/preview page
      navigate("/install", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
