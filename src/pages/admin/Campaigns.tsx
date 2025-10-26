import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Send, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  status: string;
  confidence_score: number | null;
  data_interests: string[] | null;
  last_reply_at: string | null;
}

interface CampaignEmail {
  id: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  replied_at: string | null;
  reply_body: string | null;
  lead_id: string;
  leads?: Lead;
}

export default function Campaigns() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  
  // Form state
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [leadsResponse, campaignsResponse] = await Promise.all([
        (supabase as any).from("leads").select("*").order("created_at", { ascending: false }),
        (supabase as any).from("campaign_emails").select("*").order("created_at", { ascending: false })
      ]);

      if (leadsResponse.data) setLeads(leadsResponse.data as unknown as Lead[]);
      if (campaignsResponse.data) setCampaigns(campaignsResponse.data as unknown as CampaignEmail[]);
    } catch (error) {
      console.error("Error loading campaign data:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const generateAIDraft = async () => {
    if (!selectedLead) {
      toast.error("Please select a lead first");
      return;
    }

    const lead = leads.find((l) => l.id === selectedLead);
    if (!lead) return;

    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-marketing-assistant", {
        body: {
          action: "chat",
          messages: [
            {
              role: "user",
              content: `Draft a professional B2B outreach email for ${lead.company}. Contact: ${lead.contact_name}. Industry: ${lead.data_interests?.join(", ") || "sustainability data"}. Make it personalized, concise (150-250 words), and focus on DataForEarth's ethical data marketplace value proposition.`
            }
          ]
        }
      });

      if (error) throw error;
      
      if (data?.response) {
        setBody(data.response);
        setSubject(`Partnership Opportunity with DataForEarth`);
        toast.success("AI draft generated");
      }
    } catch (error) {
      console.error("Error generating AI draft:", error);
      toast.error("Failed to generate AI draft");
    } finally {
      setAiGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!selectedLead || !subject || !body) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { error } = await (supabase as any).from("campaign_emails").insert({
        lead_id: selectedLead,
        subject,
        body,
        status: "draft"
      });

      if (error) throw error;
      
      toast.success("Draft saved");
      setComposing(false);
      setSubject("");
      setBody("");
      setSelectedLead("");
      loadData();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    }
  };

  const approveCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.functions.invoke("ai-marketing-assistant", {
        body: {
          action: "approve_campaign",
          campaign_id: campaignId
        }
      });

      if (error) throw error;
      
      toast.success("Campaign approved and sent");
      loadData();
    } catch (error) {
      console.error("Error approving campaign:", error);
      toast.error("Failed to send campaign");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Send className="h-4 w-4 text-blue-500" />;
      case "replied": return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "approved": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "draft": return <Clock className="h-4 w-4 text-yellow-500" />;
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
          <p className="text-muted-foreground">AI-powered B2B outreach and lead management</p>
        </div>
        <Button onClick={() => setComposing(!composing)}>
          {composing ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {composing && (
        <Card>
          <CardHeader>
            <CardTitle>Compose Campaign Email</CardTitle>
            <CardDescription>Select a lead and draft your outreach message</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Lead</label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company} ({lead.contact_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body"
                rows={8}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={generateAIDraft} disabled={aiGenerating} variant="outline">
                {aiGenerating ? "Generating..." : "🤖 AI Generate"}
              </Button>
              <Button onClick={saveDraft}>Save Draft</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads Pipeline</CardTitle>
            <CardDescription>{leads.length} total leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{lead.company}</p>
                    <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                  </div>
                  <Badge variant={
                    lead.status === "closed" ? "default" :
                    lead.status === "interested" ? "secondary" : "outline"
                  }>
                    {lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Emails</CardTitle>
            <CardDescription>{campaigns.length} campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(campaign.status)}
                      <span className="font-medium text-sm">{campaign.subject}</span>
                    </div>
                    {campaign.status === "draft" && (
                      <Button
                        size="sm"
                        onClick={() => approveCampaign(campaign.id)}
                      >
                        Approve & Send
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    To: {leads.find((l) => l.id === campaign.lead_id)?.company || "Unknown"}
                  </p>
                  {campaign.reply_body && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <p className="font-medium text-xs mb-1">Reply:</p>
                      <p className="text-xs">{campaign.reply_body}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
