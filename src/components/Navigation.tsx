import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Leaf, User, Building2, Shield, MoreVertical } from "lucide-react";
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

  const primaryLinks = [
    { to: "/", label: "Home" },
    { to: "/extension", label: "Extension" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/projects", label: "Projects" },
  ];

  const secondaryLinks = [
    { to: "/submit-data", label: "Submit Data" },
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
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {logoError ? (
              <div className="h-9 w-9 grid place-items-center rounded-md bg-primary/20 text-primary shadow-lg">
                <Leaf className="h-5 w-5" />
              </div>
            ) : (
              <img
                src={logo}
                alt="dataforearth logo"
                className="h-9 w-9 object-contain drop-shadow-lg"
                loading="eager"
                decoding="async"
                onError={() => setLogoError(true)}
              />
            )}
            <span className="font-bold text-base text-foreground hidden sm:inline">dataforearth</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {primaryLinks.map((link) => (
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background z-50">
                {secondaryLinks.map((link) => (
                  <DropdownMenuItem key={link.to} onClick={() => window.location.href = link.to}>
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => window.location.href = "/claim-badge"}>
                  Claim Badge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {user ? (
              <>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary" className="gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Admin</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background z-50">
                      <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/admin/campaigns"}>
                        Campaigns
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = "/admin/email-inbox"}>
                        Inbox
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Link to="/company-portal">
                  <Button size="sm" variant="default" className="gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Company</span>
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <User className="w-3.5 h-3.5" />
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
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
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
            className="lg:hidden border-t border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {[...primaryLinks, ...secondaryLinks].map((link) => (
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
                <Button size="sm" className="w-full mt-2">
                  Claim Badge
                </Button>
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <>
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-2 mt-2">Admin</div>
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" variant="outline" className="w-full justify-start">Dashboard</Button>
                      </Link>
                      <Link to="/admin/campaigns" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" variant="outline" className="w-full justify-start">Campaigns</Button>
                      </Link>
                      <Link to="/admin/email-inbox" onClick={() => setMobileMenuOpen(false)}>
                        <Button size="sm" variant="outline" className="w-full justify-start">Inbox</Button>
                      </Link>
                    </>
                  )}
                  <Link to="/company-portal" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="default" className="w-full gap-2 mt-2">
                      <Building2 className="w-4 h-4" />
                      Company Portal
                    </Button>
                  </Link>
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