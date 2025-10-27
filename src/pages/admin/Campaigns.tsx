import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Campaign {
  id: string;
  company_name: string;
  email: string;
  email_content: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  approved_by: string | null;
  actual_recipient: string | null;
  domain_verified: boolean | null;
  error_message: string | null;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };


  const approveCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-marketing-assistant", {
        body: {
          action: "approve_campaign",
          campaign_id: campaignId
        }
      });

      if (error) throw error;
      
      toast.success("Campaign approved and sent!");
      loadCampaigns();
    } catch (error) {
      console.error("Error approving campaign:", error);
      toast.error("Failed to send campaign");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "pending_approval": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading campaigns...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">AI-generated outreach campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/email-inbox")}>
            View Inbox
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Queue</CardTitle>
          <CardDescription>
            {campaigns.filter(c => c.status === "pending_approval").length} pending approval • 
            {" "}{campaigns.filter(c => c.status === "sent").length} sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns yet. Use the AI Marketing Assistant to generate campaigns.
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(campaign.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{campaign.company_name}</span>
                          <Badge variant={
                            campaign.status === "sent" ? "default" :
                            campaign.status === "pending_approval" ? "secondary" :
                            "destructive"
                          }>
                            {campaign.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{campaign.email}</p>
                        <div 
                          className="text-sm bg-muted p-3 rounded max-h-32 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: campaign.email_content.slice(0, 300) + "..." }}
                        />
                        {campaign.status === "sent" && !campaign.domain_verified && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Sent to your inbox (domain verification required)</span>
                          </div>
                        )}
                        {campaign.error_message && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-red-600">
                            <XCircle className="h-3 w-3" />
                            <span>{campaign.error_message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {campaign.status === "pending_approval" && (
                      <Button
                        size="sm"
                        onClick={() => approveCampaign(campaign.id)}
                      >
                        Approve & Send
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(campaign.created_at).toLocaleString()}
                    {campaign.sent_at && ` • Sent ${new Date(campaign.sent_at).toLocaleString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
