import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, Leaf, Droplet, Sun } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "Tree Planting in Borneo",
    description: "Reforestation program to restore rainforest habitats and support local wildlife.",
    icon: Leaf,
    funded: 75,
    goal: 50000,
    votes: 1247,
  },
  {
    id: 2,
    title: "Ocean Cleanup Drones",
    description: "Autonomous drones that collect plastic waste from ocean surfaces.",
    icon: Droplet,
    funded: 45,
    goal: 35000,
    votes: 892,
  },
  {
    id: 3,
    title: "Solar Microgrids for Rural Schools",
    description: "Installing solar power systems in remote schools to provide clean energy.",
    icon: Sun,
    funded: 60,
    goal: 40000,
    votes: 1054,
  },
];

const Projects = () => {
  const handleVote = (projectId: number) => {
    console.log("Vote for project:", projectId);
    // Will be connected to Supabase
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Green Projects</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Community-voted environmental initiatives funded by your data. 
              Every contribution makes a real impact.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-12 text-center">
            <p className="text-lg">
              <span className="font-bold text-primary">This month's project:</span>{" "}
              Funded by your data 🌱
            </p>
          </div>

          <div className="space-y-8">
            {projects.map((project, index) => {
              const Icon = project.icon;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-lg p-8 hover:border-primary/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="bg-primary/10 rounded-lg p-6">
                        <Icon className="w-12 h-12 text-primary" />
                      </div>
                    </div>

                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">
                            {project.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {project.description}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleVote(project.id)}
                          className="mt-4 md:mt-0 md:ml-4"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Vote ({project.votes})
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Funding Progress
                          </span>
                          <span className="font-semibold">
                            {project.funded}% of ${project.goal.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={project.funded} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-6">
              Want to suggest a project for the community to vote on?
            </p>
            <Button size="lg">Suggest a Project</Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Projects;