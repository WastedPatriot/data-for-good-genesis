import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  Mail, 
  Search, 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock,
  Sparkles,
  Shield,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface EmailCampaign {
  id: string;
  company_name: string;
  email: string;
  status: "draft" | "pending_approval" | "approved" | "sent" | "failed";
  email_content: string;
  research_data?: any;
  created_at: string;
  sent_at?: string;
}

export function AIMarketingAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [testEmail, setTestEmail] = useState("askewdominic86@gmail.com");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Batch campaign generation
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [batchIndustry, setBatchIndustry] = useState("technology");
  const [batchCount, setBatchCount] = useState(5);
  
  // Batch sending
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [sendingBatch, setSendingBatch] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setCampaigns((data || []) as EmailCampaign[]);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-marketing-assistant", {
        body: { 
          messages: [...messages, userMessage],
          action: "chat"
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Reload campaigns if action was taken
      if (data.campaign_created) {
        await loadCampaigns();
      }
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to communicate with AI assistant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-marketing-assistant", {
        body: { 
          action: "send_test_email",
          test_email: testEmail
        },
      });

      if (error) throw error;

      console.log('Test email result:', data);
      
      toast({
        title: "Test Email Sent!",
        description: `Check ${testEmail} for the test message from hello@dataforearth.org`,
      });
    } catch (error: any) {
      console.error("Test email error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive",
      });
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
        },
      });

      if (error) throw error;

      toast({
        title: "✅ Campaign Sent Successfully!",
        description: `Email sent from ${data?.sent_from || "hello@dataforearth.org"} to ${data?.recipient || "recipient"}. Check the Email Inbox to see it.`,
      });

      await loadCampaigns();
    } catch (error: any) {
      console.error("Approve error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve campaign",
        variant: "destructive",
      });
    }
  };

  const rejectCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from("marketing_campaigns")
        .update({ status: "failed" })
        .eq("id", campaignId);

      if (error) throw error;

      toast({
        title: "Campaign Rejected",
        description: "Campaign has been marked as failed",
      });

      await loadCampaigns();
    } catch (error: any) {
      console.error("Reject error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject campaign",
        variant: "destructive",
      });
    }
  };

  const generateBatchCampaigns = async () => {
    setGeneratingBatch(true);
    try {
      toast({
        title: "Generating Campaigns",
        description: `Researching ${batchCount} companies in ${batchIndustry} industry...`,
      });

      const { data, error } = await supabase.functions.invoke("generate-marketing-campaigns", {
        body: {
          industry: batchIndustry,
          count: batchCount,
          keywords: ["sustainability", "ESG", "climate data"]
        }
      });

      if (error) throw error;

      toast({
        title: "Campaigns Generated!",
        description: `${data.campaigns_created} personalized campaigns ready for review`,
      });

      await loadCampaigns();
    } catch (error: any) {
      console.error("Batch generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate campaigns",
        variant: "destructive",
      });
    } finally {
      setGeneratingBatch(false);
    }
  };

  const sendBatchCampaigns = async () => {
    if (selectedCampaigns.length === 0) {
      toast({
        title: "No Campaigns Selected",
        description: "Please select campaigns to send",
        variant: "destructive",
      });
      return;
    }

    setSendingBatch(true);
    try {
      toast({
        title: "Sending Campaigns",
        description: `Sending ${selectedCampaigns.length} emails...`,
      });

      const { data, error } = await supabase.functions.invoke("send-marketing-batch", {
        body: { campaign_ids: selectedCampaigns }
      });

      if (error) throw error;

      toast({
        title: "Batch Send Complete",
        description: `Sent ${data.sent} emails successfully. ${data.failed} failed.`,
      });

      setSelectedCampaigns([]);
      await loadCampaigns();
    } catch (error: any) {
      console.error("Batch send error:", error);
      toast({
        title: "Batch Send Failed",
        description: error.message || "Failed to send campaigns",
        variant: "destructive",
      });
    } finally {
      setSendingBatch(false);
    }
  };

  const toggleCampaignSelection = (id: string) => {
    setSelectedCampaigns(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const selectAllPending = () => {
    const pendingIds = campaigns
      .filter(c => c.status === "pending_approval")
      .map(c => c.id);
    setSelectedCampaigns(pendingIds);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "secondary" as const, icon: Clock },
      pending_approval: { variant: "default" as const, icon: AlertTriangle },
      approved: { variant: "default" as const, icon: CheckCircle },
      sent: { variant: "default" as const, icon: CheckCircle },
      failed: { variant: "destructive" as const, icon: XCircle },
    };

    const config = variants[status as keyof typeof variants] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                AI Marketing Assistant
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Secure
                </Badge>
              </CardTitle>
              <CardDescription>
                Automated research, email drafting, and outreach to potential partners
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat">AI Chat</TabsTrigger>
              <TabsTrigger value="batch">Batch Generate</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
              <TabsTrigger value="test">Test Email</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <ScrollArea className="h-[400px] w-full border rounded-lg p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Start a conversation with your AI Marketing Assistant</p>
                    <p className="text-sm mt-2">
                      Try: "Research and draft an email to companies working on carbon capture technology"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask the AI to research companies, draft emails, or manage campaigns..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                  disabled={loading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                  className="h-[80px] w-[80px]"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Features
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ All emails require admin approval before sending</li>
                  <li>✓ Rate limiting prevents spam and abuse</li>
                  <li>✓ Company research verified before outreach</li>
                  <li>✓ No sensitive data shared without permission</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <Card className="border-dashed border-2 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Automated Campaign Generation
                  </CardTitle>
                  <CardDescription>
                    AI researches companies and generates personalized outreach emails
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Target Industry</Label>
                      <Input
                        id="industry"
                        value={batchIndustry}
                        onChange={(e) => setBatchIndustry(e.target.value)}
                        placeholder="e.g., renewable energy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="count">Number of Campaigns</Label>
                      <Input
                        id="count"
                        type="number"
                        min="1"
                        max="20"
                        value={batchCount}
                        onChange={(e) => setBatchCount(parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={generateBatchCampaigns}
                    disabled={generatingBatch}
                    className="w-full"
                    size="lg"
                  >
                    {generatingBatch ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Researching & Generating...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Generate {batchCount} Campaigns
                      </>
                    )}
                  </Button>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm">What happens:</h4>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>AI researches {batchCount} companies in {batchIndustry}</li>
                      <li>Analyzes each company's sustainability initiatives</li>
                      <li>Generates personalized emails referencing their work</li>
                      <li>Saves all campaigns for your review & approval</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              {campaigns.filter(c => c.status === "pending_approval").length > 0 && (
                <div className="flex gap-2 items-center">
                  <Button
                    onClick={selectAllPending}
                    variant="outline"
                    size="sm"
                  >
                    Select All Pending ({campaigns.filter(c => c.status === "pending_approval").length})
                  </Button>
                  {selectedCampaigns.length > 0 && (
                    <Button
                      onClick={sendBatchCampaigns}
                      disabled={sendingBatch}
                      size="sm"
                    >
                      {sendingBatch ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send {selectedCampaigns.length} Selected
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <ScrollArea className="h-[500px]">
                {campaigns.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns yet</p>
                    <p className="text-sm mt-2">Use the AI Chat to create email campaigns</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <Card key={campaign.id} className="border">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {campaign.status === "pending_approval" && (
                                <input
                                  type="checkbox"
                                  checked={selectedCampaigns.includes(campaign.id)}
                                  onChange={() => toggleCampaignSelection(campaign.id)}
                                  className="mt-1"
                                />
                              )}
                              <div>
                                <CardTitle className="text-lg">{campaign.company_name}</CardTitle>
                                <CardDescription className="mt-1">{campaign.email}</CardDescription>
                              </div>
                            </div>
                            {getStatusBadge(campaign.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Email Content</Label>
                            <div className="bg-muted/50 rounded p-3 mt-1">
                              <p className="text-sm whitespace-pre-wrap">{campaign.email_content}</p>
                            </div>
                          </div>

                          {campaign.research_data && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Research Data</Label>
                              <div className="bg-muted/50 rounded p-3 mt-1">
                                <pre className="text-xs overflow-x-auto">
                                  {JSON.stringify(campaign.research_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {campaign.status === "pending_approval" && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => approveCampaign(campaign.id)}
                                className="flex-1"
                                variant="default"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Send
                              </Button>
                              <Button
                                onClick={() => rejectCampaign(campaign.id)}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(campaign.created_at).toLocaleString()}
                            {campaign.sent_at && (
                              <> • Sent: {new Date(campaign.sent_at).toLocaleString()}</>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Test Email Configuration</CardTitle>
                  <CardDescription>
                    Send a test email to verify the system is working correctly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-email">Test Email Address</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <Button
                    onClick={sendTestEmail}
                    disabled={loading || !testEmail}
                    className="w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Email Configuration</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>✓ Sending from: hello@dataforearth.org</p>
                      <p>✓ Using Resend email service</p>
                      <p>✓ Rate limited to prevent abuse</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
