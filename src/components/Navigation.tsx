import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-new.png";

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Defer admin check to avoid blocking
      if (session?.user) {
        setTimeout(() => {
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .eq("role", "admin")
            .maybeSingle()
            .then(({ data: roleData }) => {
              setIsAdmin(!!roleData);
            });
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data: roleData }) => {
            setIsAdmin(!!roleData);
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/submit-data", label: "Submit Data" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/projects", label: "Projects" },
    { to: "/about", label: "About" },
    { to: "/donate", label: "Donate" },
    { to: "/contact", label: "Contact" },
    { to: "/help", label: "Help" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {logoError ? (
              <div className="h-10 w-10 grid place-items-center rounded-md bg-secondary text-primary">
                <Leaf className="h-6 w-6" />
              </div>
            ) : (
              <img
                src={logo}
                alt="Data for Earth logo"
                className="h-10 w-10 object-contain"
                loading="eager"
                decoding="async"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="font-bold text-lg">Data for Earth</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/claim-badge">
              <Button size="sm" variant="outline">Claim Badge</Button>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button size="sm" variant="secondary">Admin</Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) throw error;
                      setUser(null);
                      setIsAdmin(false);
                      window.location.href = "/";
                    } catch (error) {
                      console.error("Logout error:", error);
                    }
                  }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.to
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/claim-badge" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Claim Badge
                </Button>
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="sm" variant="secondary" className="w-full">Admin</Button>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.signOut();
                        if (error) throw error;
                        setUser(null);
                        setIsAdmin(false);
                        setMobileMenuOpen(false);
                        window.location.href = "/";
                      } catch (error) {
                        console.error("Logout error:", error);
                      }
                    }}
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Sign In</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;