import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Chrome, Target, TrendingUp, Award, Share2 } from "lucide-react";

export default function WelcomeExtension() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Real-Time Carbon Tracking",
      description: "See company CO₂ emissions instantly as you browse"
    },
    {
      icon: TrendingUp,
      title: "Sustainability Scores",
      description: "Get instant ratings for every company you visit"
    },
    {
      icon: Award,
      title: "Gamification & Challenges",
      description: "Earn badges, complete challenges, and level up"
    },
    {
      icon: Share2,
      title: "Social Impact Sharing",
      description: "Share your carbon tracking achievements on social media"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-16 px-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 text-lg px-4 py-1">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Extension Installed!
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to DataForEarth
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You've just unlocked the power to track company carbon footprints in real-time. 
            Let's get you started on your climate activism journey.
          </p>
        </div>

        {/* Quick Start Guide */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="w-5 h-5" />
              How It Works
            </CardTitle>
            <CardDescription>Start tracking carbon emissions in 3 simple steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sign in to your account</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your DataForEarth account to sync your progress and unlock all features
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Browse the web normally</h3>
                <p className="text-sm text-muted-foreground">
                  Visit company websites and we'll automatically show you their carbon footprint data
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track your impact</h3>
                <p className="text-sm text-muted-foreground">
                  Earn points, complete challenges, and share your climate awareness achievements
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-muted hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Icon className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button 
            size="lg" 
            className="text-lg px-8"
            onClick={() => navigate("/login")}
          >
            Sign In to Start Tracking
          </Button>
          <p className="text-sm text-muted-foreground">
            Already signed in? Click the extension icon in your browser toolbar to get started!
          </p>
        </div>

        {/* Example Companies */}
        <Card className="mt-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Companies Already in Our Database</CardTitle>
            <CardDescription>
              Track emissions data for Amazon, Google, Microsoft, Apple, Meta, Walmart, Tesla, and more!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Amazon", "Google", "Microsoft", "Apple", "Meta", "Walmart", "Tesla", "ExxonMobil"].map((company) => (
                <Badge key={company} variant="secondary" className="text-sm py-1 px-3">
                  {company}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>💚 Thank you for joining the climate data movement</p>
          <p className="mt-2">
            Questions? Visit our <a href="/help" className="text-primary hover:underline">Help Center</a> or 
            contact <a href="/contact" className="text-primary hover:underline">support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
