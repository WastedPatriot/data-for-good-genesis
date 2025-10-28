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
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-lg">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  AI Marketing Assistant
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Active
                  </Badge>
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  AI-powered campaign generation & email automation
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{campaigns.length}</div>
              <div className="text-xs text-muted-foreground">Total Campaigns</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="batch" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="batch">Generate Campaigns</TabsTrigger>
              <TabsTrigger value="campaigns">
                Review & Send ({campaigns.filter(c => c.status === "pending_approval").length})
              </TabsTrigger>
              <TabsTrigger value="chat">AI Assistant</TabsTrigger>
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

            <TabsContent value="batch" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Quick Campaign Generation
                    </CardTitle>
                    <CardDescription>
                      AI finds and researches companies, then generates personalized emails
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="industry" className="text-base">Target Industry</Label>
                        <Input
                          id="industry"
                          value={batchIndustry}
                          onChange={(e) => setBatchIndustry(e.target.value)}
                          placeholder="renewable energy, carbon capture, etc."
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="count" className="text-base">Number of Companies</Label>
                        <Input
                          id="count"
                          type="number"
                          min="1"
                          max="20"
                          value={batchCount}
                          onChange={(e) => setBatchCount(parseInt(e.target.value))}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={generateBatchCampaigns}
                      disabled={generatingBatch || !batchIndustry.trim()}
                      className="w-full"
                      size="lg"
                    >
                      {generatingBatch ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating Campaigns...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate {batchCount} Campaigns
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-muted">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Test Email System
                    </CardTitle>
                    <CardDescription>
                      Verify your email configuration is working
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="testEmail" className="text-base">Test Email Address</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-11"
                      />
                    </div>
                    <Button
                      onClick={sendTestEmail}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Send Test Email
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/30 border-dashed border-2">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      How It Works
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-2">
                      <li>AI researches {batchCount} companies in "{batchIndustry}" industry</li>
                      <li>Analyzes each company's sustainability initiatives and data needs</li>
                      <li>Generates personalized outreach emails referencing their specific work</li>
                      <li>All campaigns require your manual review & approval before sending</li>
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

            <TabsContent value="chat" className="space-y-4">
              <ScrollArea className="h-[400px] w-full border rounded-lg p-4 bg-card">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-lg">AI Marketing Assistant</p>
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
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
