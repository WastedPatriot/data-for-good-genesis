import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send, Inbox, SendHorizonal, Plus, RefreshCw } from "lucide-react";

interface EmailMessage {
  id: string;
  type: "contact" | "conversation" | "campaign" | "manual";
  direction: "inbound" | "outbound";
  from_email: string;
  to_email: string;
  subject: string;
  message: string;
  sent_at: string;
  status: string;
  contact_name?: string;
}

export default function EmailInbox() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [filter, setFilter] = useState<"all" | "inbox" | "sent">("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Compose form
  const [composeTo, setComposeTo] = useState("");
  const [composeFrom, setComposeFrom] = useState("hello@dataforearth.org");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const emailAccounts = [
    { value: "all", label: "All Accounts" },
    { value: "hello@dataforearth.org", label: "hello@dataforearth.org" },
    { value: "contact@dataforearth.org", label: "contact@dataforearth.org" },
    { value: "partnerships@dataforearth.org", label: "partnerships@dataforearth.org" },
    { value: "noreply@dataforearth.org", label: "noreply@dataforearth.org" },
  ];

  useEffect(() => {
    checkAuth();
    loadAllEmails();
  }, [selectedAccount, filter]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast.error("Admin access required");
      navigate("/");
    }
  };

  const loadAllEmails = async () => {
    setLoading(true);
    try {
      const allEmails: EmailMessage[] = [];

      // Load contact submissions (inbound)
      const { data: contacts } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (contacts) {
        contacts.forEach((contact) => {
          allEmails.push({
            id: contact.id,
            type: "contact",
            direction: "inbound",
            from_email: contact.email,
            to_email: "contact@dataforearth.org",
            subject: contact.subject,
            message: contact.message,
            sent_at: contact.created_at,
            status: contact.status,
            contact_name: contact.name,
          });
        });
      }

      // Load conversation threads (both inbound and outbound)
      const { data: threads } = await supabase
        .from("conversation_threads")
        .select("*")
        .order("sent_at", { ascending: false });

      if (threads) {
        threads.forEach((thread) => {
          allEmails.push({
            id: thread.id,
            type: "conversation",
            direction: thread.direction as "inbound" | "outbound",
            from_email: thread.from_email,
            to_email: thread.to_email,
            subject: thread.subject,
            message: thread.message,
            sent_at: thread.sent_at,
            status: thread.status,
          });
        });
      }

      // Sort all emails by date
      allEmails.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

      // Filter by account
      let filtered = allEmails;
      if (selectedAccount !== "all") {
        filtered = allEmails.filter(
          (email) => email.from_email === selectedAccount || email.to_email === selectedAccount
        );
      }

      // Filter by direction
      if (filter === "inbox") {
        filtered = filtered.filter((email) => email.direction === "inbound");
      } else if (filter === "sent") {
        filtered = filtered.filter((email) => email.direction === "outbound");
      }

      setEmails(filtered);
    } catch (error) {
      console.error("Error loading emails:", error);
      toast.error("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  const sendManualEmail = async () => {
    if (!composeTo || !composeSubject || !composeMessage) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          to: composeTo,
          from: composeFrom,
          subject: composeSubject,
          message: composeMessage,
          contactName: null,
          originalMessage: null,
          contactSubmissionId: null,
        },
      });

      if (error) throw error;

      // Log the manual email in conversation_threads
      await supabase.from("conversation_threads").insert({
        contact_submission_id: null,
        direction: "outbound",
        from_email: composeFrom,
        to_email: composeTo,
        subject: composeSubject,
        message: composeMessage,
        status: "sent",
      });

      toast.success("Email sent successfully!");
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeMessage("");
      loadAllEmails();
    } catch (error: any) {
      console.error("Send email error:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const stats = {
    total: emails.length,
    inbox: emails.filter((e) => e.direction === "inbound").length,
    sent: emails.filter((e) => e.direction === "outbound").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Email Inbox</h1>
            <p className="text-muted-foreground">Unified inbox for all email accounts</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAllEmails} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Compose Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Compose New Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">From:</label>
                  <Select value={composeFrom} onValueChange={setComposeFrom}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailAccounts.slice(1).map((account) => (
                        <SelectItem key={account.value} value={account.value}>
                          {account.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">To:</label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject:</label>
                  <Input
                    placeholder="Email subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message:</label>
                  <Textarea
                    placeholder="Type your message..."
                    value={composeMessage}
                    onChange={(e) => setComposeMessage(e.target.value)}
                    rows={10}
                  />
                </div>
                <Button
                  onClick={sendManualEmail}
                  disabled={isSending || !composeTo || !composeSubject || !composeMessage}
                  className="w-full"
                >
                  {isSending ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Total Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-500" />
              Inbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inbox}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <SendHorizonal className="h-4 w-4 text-green-500" />
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Account:</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emailAccounts.map((account) => (
                    <SelectItem key={account.value} value={account.value}>
                      {account.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Mailbox:</label>
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="flex-1"
                >
                  All ({stats.total})
                </Button>
                <Button
                  variant={filter === "inbox" ? "default" : "outline"}
                  onClick={() => setFilter("inbox")}
                  className="flex-1"
                >
                  Inbox ({stats.inbox})
                </Button>
                <Button
                  variant={filter === "sent" ? "default" : "outline"}
                  onClick={() => setFilter("sent")}
                  className="flex-1"
                >
                  Sent ({stats.sent})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <div className="space-y-4">
        {emails.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No emails found
            </CardContent>
          </Card>
        ) : (
          emails.map((email) => (
            <Card key={email.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant={email.direction === "inbound" ? "default" : "secondary"}>
                          {email.direction === "inbound" ? (
                            <><Inbox className="h-3 w-3 mr-1" />Received</>
                          ) : (
                            <><SendHorizonal className="h-3 w-3 mr-1" />Sent</>
                          )}
                        </Badge>
                        <Badge variant="outline">{email.type}</Badge>
                        {email.status && (
                          <Badge variant="outline">{email.status}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg">{email.subject}</h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <strong>From:</strong> {email.contact_name ? `${email.contact_name} <${email.from_email}>` : email.from_email}
                        </p>
                        <p>
                          <strong>To:</strong> {email.to_email}
                        </p>
                        <p>
                          <strong>Date:</strong> {new Date(email.sent_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{email.message}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
