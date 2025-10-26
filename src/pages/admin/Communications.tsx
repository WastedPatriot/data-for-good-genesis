import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Send, CheckCircle, Clock, AlertCircle,
  Inbox, TrendingUp, Zap, AlertTriangle, FileText
} from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submission_type: string;
  status: string;
  organization?: string;
  created_at: string;
  admin_notes?: string;
  severity_score?: number;
  priority_level?: string;
  ai_analysis?: any;
  last_response_at?: string;
  response_time_minutes?: number;
}

interface ConversationThread {
  id: string;
  direction: "inbound" | "outbound";
  from_email: string;
  to_email: string;
  subject: string;
  message: string;
  sent_at: string;
  status: string;
}

export default function Communications() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null);
  const [conversationThreads, setConversationThreads] = useState<ConversationThread[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFrom, setReplyFrom] = useState<string>("hello");
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showThreads, setShowThreads] = useState(false);

  useEffect(() => {
    checkAuth();
    loadContacts();
    setupRealtime();
  }, [filter]);

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

  const setupRealtime = () => {
    const channel = supabase
      .channel('communications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions'
        },
        () => {
          loadContacts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadContacts = async () => {
    try {
      let query = supabase
        .from("contact_submissions")
        .select("*")
        .order("severity_score", { ascending: false })
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.error("Failed to load communications");
    }
  };

  const loadConversationThreads = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversation_threads")
        .select("*")
        .eq("contact_submission_id", contactId)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      setConversationThreads((data || []) as ConversationThread[]);
      setShowThreads(true);
    } catch (error) {
      console.error("Error loading threads:", error);
      toast.error("Failed to load conversation history");
    }
  };

  const getEmailFromAddress = (type: string): string => {
    const emailMap: { [key: string]: string } = {
      "hello": "hello@dataforearth.org",
      "contact": "contact@dataforearth.org",
      "partnerships": "partnerships@dataforearth.org",
      "noreply": "noreply@dataforearth.org",
    };
    return emailMap[type] || emailMap["hello"];
  };

  const sendReply = async () => {
    if (!selectedContact || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-admin-reply", {
        body: {
          to: selectedContact.email,
          from: getEmailFromAddress(replyFrom),
          subject: `Re: ${selectedContact.subject}`,
          message: replyMessage,
          originalMessage: selectedContact.message,
          contactName: selectedContact.name,
          contactSubmissionId: selectedContact.id,
        },
      });

      if (error) throw error;

      // Update status to responded
      await supabase
        .from("contact_submissions")
        .update({
          status: "responded",
          admin_notes: replyMessage,
        })
        .eq("id", selectedContact.id);

      toast.success("Reply sent successfully!");
      setReplyMessage("");
      setSelectedContact(null);
      setShowThreads(false);
      loadContacts();
    } catch (error: any) {
      console.error("Send reply error:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const markAsResolved = async (id: string) => {
    try {
      await supabase
        .from("contact_submissions")
        .update({ status: "resolved" })
        .eq("id", id);

      toast.success("Marked as resolved");
      loadContacts();
    } catch (error) {
      console.error("Error marking as resolved:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "responded":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return <Zap className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    const colors: { [key: string]: string } = {
      "urgent": "bg-red-500/10 text-red-500 border-red-500",
      "high": "bg-orange-500/10 text-orange-500 border-orange-500",
      "medium": "bg-yellow-500/10 text-yellow-500 border-yellow-500",
      "low": "bg-blue-500/10 text-blue-500 border-blue-500",
    };
    return colors[priority || "low"];
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "general": "bg-blue-500/10 text-blue-500",
      "partnership": "bg-purple-500/10 text-purple-500",
      "support": "bg-orange-500/10 text-orange-500",
      "data_inquiry": "bg-green-500/10 text-green-500",
      "complaint": "bg-red-500/10 text-red-500",
    };
    return colors[type] || colors["general"];
  };

  const stats = {
    pending: contacts.filter(c => c.status === "pending").length,
    responded: contacts.filter(c => c.status === "responded").length,
    resolved: contacts.filter(c => c.status === "resolved").length,
    urgent: contacts.filter(c => c.priority_level === "urgent").length,
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
            <h1 className="text-3xl font-bold">Communications Center</h1>
            <p className="text-muted-foreground">AI-powered inbox with full conversation threading</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/email-inbox")}> 
            <Mail className="h-4 w-4 mr-2" />
            Open Email Inbox
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/review")}>
            <FileText className="h-4 w-4 mr-2" />
            Review Queue
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              Responded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-red-500" />
              Urgent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All ({contacts.length})
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              variant={filter === "responded" ? "default" : "outline"}
              onClick={() => setFilter("responded")}
            >
              Responded ({stats.responded})
            </Button>
            <Button
              variant={filter === "resolved" ? "default" : "outline"}
              onClick={() => setFilter("resolved")}
            >
              Resolved ({stats.resolved})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communications List */}
      <div className="space-y-4">
        {contacts.map((contact) => (
          <Card key={contact.id} className={contact.priority_level === "urgent" ? "border-2 border-red-500" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusIcon(contact.status)}
                    {contact.priority_level && (
                      <Badge className={getPriorityColor(contact.priority_level)} variant="outline">
                        {getPriorityIcon(contact.priority_level)}
                        <span className="ml-1">{contact.priority_level.toUpperCase()}</span>
                      </Badge>
                    )}
                    <Badge className={getTypeColor(contact.submission_type)}>
                      {contact.submission_type}
                    </Badge>
                    <Badge variant="outline">{contact.status}</Badge>
                    {contact.organization && (
                      <Badge variant="secondary">{contact.organization}</Badge>
                    )}
                    {contact.severity_score && (
                      <Badge variant="outline" className="font-mono">
                        Score: {(contact.severity_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{contact.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      From: {contact.name} ({contact.email})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contact.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm mt-2">{contact.message}</p>
                  
                  {/* AI Insights */}
                  {contact.ai_analysis && (
                    <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs font-semibold text-blue-500 mb-2">🤖 AI Analysis</p>
                      <p className="text-xs">{contact.ai_analysis.key_insights}</p>
                      {contact.ai_analysis.sentiment && (
                        <p className="text-xs mt-1">
                          Sentiment: <span className="font-semibold">{contact.ai_analysis.sentiment}</span>
                        </p>
                      )}
                      {contact.ai_analysis.suggested_response_time && (
                        <p className="text-xs mt-1">
                          Respond: <span className="font-semibold">{contact.ai_analysis.suggested_response_time}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {contact.admin_notes && (
                    <div className="mt-2 p-3 bg-green-500/10 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Admin Response:</p>
                      <p className="text-sm">{contact.admin_notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadConversationThreads(contact.id)}
                  >
                    <Inbox className="h-4 w-4 mr-2" />
                    View Thread
                  </Button>
                  {contact.status === "pending" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Reply
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Send Reply</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Send From:</label>
                            <Select value={replyFrom} onValueChange={setReplyFrom}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hello">hello@dataforearth.org</SelectItem>
                                <SelectItem value="contact">contact@dataforearth.org</SelectItem>
                                <SelectItem value="partnerships">partnerships@dataforearth.org</SelectItem>
                                <SelectItem value="noreply">noreply@dataforearth.org</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">To: {contact.email}</label>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Subject: Re: {contact.subject}</label>
                          </div>
                          <Textarea
                            placeholder="Type your reply..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={8}
                          />
                          <Button
                            onClick={sendReply}
                            disabled={isSending || !replyMessage.trim()}
                            className="w-full"
                          >
                            {isSending ? "Sending..." : "Send Reply"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {contact.status === "responded" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsResolved(contact.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {contacts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No communications found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Conversation Threads Dialog */}
      <Dialog open={showThreads} onOpenChange={setShowThreads}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conversation History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {conversationThreads.map((thread) => (
              <div
                key={thread.id}
                className={`p-4 rounded-lg ${
                  thread.direction === "inbound"
                    ? "bg-blue-500/10 ml-0 mr-8"
                    : "bg-green-500/10 ml-8 mr-0"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {thread.direction === "inbound" ? (
                      <Badge variant="outline" className="bg-blue-500/20">
                        📥 From Customer
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/20">
                        📤 From Admin
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(thread.sent_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">
                  From: {thread.from_email} → To: {thread.to_email}
                </p>
                <p className="text-sm font-semibold mb-2">{thread.subject}</p>
                <p className="text-sm">{thread.message}</p>
              </div>
            ))}
            {conversationThreads.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No conversation history available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}