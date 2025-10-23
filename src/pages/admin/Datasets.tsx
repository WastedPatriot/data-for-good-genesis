import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";

export default function AdminDatasets() {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAndLoadDatasets();
  }, []);

  const checkAdminAndLoadDatasets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        navigate("/");
        return;
      }

      await loadDatasets();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    }
  };

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("datasets")
        .select("*, purchases(count)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error) {
      console.error("Error loading datasets:", error);
      toast.error("Failed to load datasets");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("datasets")
        .update({ active: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentState ? "Dataset hidden" : "Dataset activated");
      await loadDatasets();
    } catch (error) {
      console.error("Error toggling dataset:", error);
      toast.error("Failed to update dataset");
    }
  };

  const toggleFeatured = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("datasets")
        .update({ featured: !currentState })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentState ? "Removed from featured" : "Added to featured");
      await loadDatasets();
    } catch (error) {
      console.error("Error toggling featured:", error);
      toast.error("Failed to update dataset");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dataset Management</h1>
              <p className="text-muted-foreground">Manage marketplace datasets</p>
            </div>
          </div>
          <Button onClick={() => navigate("/admin/release-policy")}>
            Release Policy
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Datasets</CardTitle>
            <CardDescription>Manage dataset visibility and features</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading datasets...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">
                        {dataset.name}
                        {dataset.enterprise_grade && (
                          <Badge variant="secondary" className="ml-2">Enterprise</Badge>
                        )}
                      </TableCell>
                      <TableCell>{dataset.category}</TableCell>
                      <TableCell>${dataset.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dataset.source_channel || 'on_site'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={dataset.active}
                          onCheckedChange={() => toggleActive(dataset.id, dataset.active)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFeatured(dataset.id, dataset.featured)}
                        >
                          <Star className={`w-4 h-4 ${dataset.featured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                      </TableCell>
                      <TableCell>{dataset.purchases?.length || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
