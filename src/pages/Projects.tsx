import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, Leaf, Droplet, Sun, Wind, TreesIcon, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  funding_goal: number;
  funded_amount: number;
  votes_count: number;
  status: string;
  category: string;
  icon: string;
  charity_registration_number?: string;
  website_url?: string;
}

interface UserVote {
  project_id: string;
  vote_weight: number;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    checkUserVotes();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .in("status", ["verified", "active", "funded"])
        .order("votes_count", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserVotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("project_votes")
        .select("project_id, vote_weight")
        .eq("user_id", user.id);
      
      setUserVotes(data || []);
    }
  };

  const handleVote = async (projectId: string) => {
    try {
      setVotingId(projectId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to vote for projects",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const isVoted = userVotes.some(v => v.project_id === projectId);
      const action = isVoted ? "unvote" : "vote";

      const { data, error } = await supabase.functions.invoke("vote-project", {
        body: { projectId, action },
      });

      if (error) throw error;

      toast({
        title: isVoted ? "Vote removed" : "Vote recorded!",
        description: data.vote_weight 
          ? `Your vote weight: ${data.vote_weight} (based on ${data.contribution_count} data contributions)`
          : "Thank you for voting!",
      });

      // Refresh data
      await fetchProjects();
      await checkUserVotes();
    } catch (error: any) {
      console.error("Vote error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    } finally {
      setVotingId(null);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Leaf, Droplet, Sun, Wind, TreesIcon
    };
    return icons[iconName] || Leaf;
  };

  const hasVoted = (projectId: string) => {
    return userVotes.some(v => v.project_id === projectId);
  };

  const fundingPercentage = (project: Project) => {
    return Math.min((project.funded_amount / project.funding_goal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black mb-4 text-gradient">Community Green Projects</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Vote for verified environmental initiatives funded by dataset sales. 
              Every data contribution increases your voting power.
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl p-8 mb-12 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-black">All Projects Verified</h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Every project undergoes AI-assisted fraud detection and admin verification before going live.
              Your votes fund real, impactful environmental work.
            </p>
          </div>

          <div className="space-y-8">
            {projects.length === 0 ? (
              <div className="text-center py-16">
                <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No Active Projects Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Check back soon for community-voted environmental initiatives.
                </p>
                <Button onClick={() => navigate("/contact")}>
                  Suggest a Project
                </Button>
              </div>
            ) : (
              projects.map((project, index) => {
                const IconComponent = getIconComponent(project.icon);
                const voted = hasVoted(project.id);
                const voting = votingId === project.id;
                const percentage = fundingPercentage(project);

                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border-2 border-border rounded-xl p-8 hover:border-primary/50 hover-lift transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-6">
                          <IconComponent className="w-16 h-16 text-primary" />
                        </div>
                      </div>

                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-black">{project.title}</h3>
                              {project.charity_registration_number && (
                                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                                  <CheckCircle className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold text-primary">VERIFIED</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              by {project.organization_name}
                            </p>
                            <p className="text-muted-foreground mb-4">
                              {project.description}
                            </p>
                            {project.website_url && (
                              <a 
                                href={project.website_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                Visit Website →
                              </a>
                            )}
                          </div>
                          
                          <Button
                            variant={voted ? "default" : "outline"}
                            onClick={() => handleVote(project.id)}
                            disabled={voting}
                            className="mt-4 md:mt-0 md:ml-4 border-2 hover-lift font-bold whitespace-nowrap"
                          >
                            {voting ? (
                              "Processing..."
                            ) : voted ? (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Voted ({project.votes_count})
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                Vote ({project.votes_count})
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Funding Progress
                            </span>
                            <span className="font-bold text-gradient">
                              ${project.funded_amount.toLocaleString()} of ${project.funding_goal.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-3" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{percentage.toFixed(1)}% funded</span>
                            <span>{project.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="mt-16 bg-card/80 border-2 border-border rounded-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black mb-4">How Voting Works</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Vote Weight</h3>
                <p className="text-sm text-muted-foreground">
                  Your voting power increases with every 10 data contributions you make
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Verified Projects</h3>
                <p className="text-sm text-muted-foreground">
                  AI + admin verification ensures every project is legitimate
                </p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold mb-2">Real Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Winning projects receive funding from dataset sales revenue
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Have a verified environmental project that needs funding?
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate("/contact")}
              className="border-glow hover-lift font-black"
            >
              Submit Your Project for Review
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Projects;