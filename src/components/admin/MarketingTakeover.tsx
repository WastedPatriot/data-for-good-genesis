import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Send, Bot, User } from "lucide-react";

interface MarketingTakeoverProps {
  campaignId: string;
  companyEmail: string;
  companyName: string;
  onClose: () => void;
}

export function MarketingTakeover({ campaignId, companyEmail, companyName, onClose }: MarketingTakeoverProps) {
  const { toast } = useToast();
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleTakeover = async () => {
    setIsTakingOver(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create takeover record
      const { error } = await supabase
        .from("marketing_takeovers")
        .insert({
          campaign_id: campaignId,
          taken_over_by: user.id,
          takeover_reason: "Manual intervention required",
          ai_disabled: true
        });

      if (error) throw error;

      setTakenOver(true);
      toast({
        title: "Campaign Taken Over",
        description: "AI responses disabled. You're now in control.",
      });
    } catch (error: any) {
      toast({
        title: "Takeover Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject || !message) {
      toast({
        title: "Missing Fields",
        description: "Please fill in subject and message",
        variant: "destructive"
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          to: companyEmail,
          subject,
          message,
          campaign_id: campaignId
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: `Manual email delivered to ${companyName}`,
      });

      // Log in audit
      await supabase.from("audit_logs").insert({
        action: "manual_marketing_email",
        resource_type: "marketing_campaign",
        resource_id: campaignId,
        severity: "info",
        details: { to: companyEmail, subject }
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {takenOver ? (
              <Badge variant="default" className="bg-primary">
                <User className="w-3 h-3 mr-1" />
                Manual Control
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Bot className="w-3 h-3 mr-1" />
                AI Active
              </Badge>
            )}
            <div>
              <CardTitle>Campaign Takeover</CardTitle>
              <CardDescription>{companyName} - {companyEmail}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!takenOver ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  AI is currently handling this campaign
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Taking over will disable AI responses and give you full manual control
                </p>
              </div>
            </div>
            <Button 
              onClick={handleTakeover} 
              disabled={isTakingOver}
              className="w-full"
            >
              {isTakingOver ? "Taking Over..." : "Take Over Campaign"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Re: DataForEarth Partnership Opportunity"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea
                id="message"
                placeholder={`Hi ${companyName} team,\n\nI wanted to personally reach out...`}
                rows={12}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendEmail} 
                disabled={sending}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Sending..." : "Send Email"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 Tip: Personalize based on their industry, recent news, or specific sustainability challenges they face.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
