import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, MessageCircle, HelpCircle, Book } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const quickQuestions = [
  "How do I install my eSIM?",
  "Why isn't my data working?",
  "How do I check my data usage?",
  "Can I use multiple eSIMs?",
  "What is Virtual Location?",
  "How do I get a refund?"
];

const Support = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your DataForEarth assistant. How can I help you today? I'm available 24/7 to answer questions about your eSIMs, plans, and features.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (message?: string) => {
    const messageToSend = message || input;
    if (!messageToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response - in production, this would call your AI backend
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(messageToSend),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('install') || q.includes('setup')) {
      return "To install your eSIM:\n\n1. Go to Settings on your device\n2. Tap Cellular or Mobile Data\n3. Tap Add Cellular Plan\n4. Scan the QR code from the My eSIMs page\n5. Follow the on-screen instructions\n\nYour eSIM will be ready to use in seconds! Need help finding your QR code? Just open the My eSIMs page and tap 'View QR Code' on your plan.";
    }
    
    if (q.includes('data') && (q.includes('not working') || q.includes('doesn\'t work') || q.includes('isn\'t working'))) {
      return "If your data isn't working, try these steps:\n\n1. Make sure Data Roaming is enabled for your eSIM\n2. Check if you have data remaining (view in My eSIMs)\n3. Toggle Airplane Mode on and off\n4. Restart your device\n5. Make sure the eSIM is selected as your primary data line\n\nStill having issues? Let me know which step you're on and I can help further!";
    }
    
    if (q.includes('virtual location') || q.includes('vpn')) {
      return "Virtual Location lets you appear online from a different country:\n\n• Access your home country's streaming content while traveling\n• Browse more privately on public WiFi\n• Choose from 50+ countries\n\nIt's not a full VPN, but provides IP masking for basic privacy and content access. To use it, go to the Virtual Location page, select a country, and toggle it on!";
    }
    
    if (q.includes('usage') || q.includes('check data')) {
      return "You can check your data usage in real-time:\n\n1. Open the My eSIMs page\n2. You'll see a data usage bar for each active plan\n3. The percentage shows how much you've used\n4. Tap the plan for detailed statistics\n\nWe'll also send you notifications at 80% and 90% usage so you're never surprised!";
    }
    
    if (q.includes('refund') || q.includes('cancel')) {
      return "Our refund policy:\n\n• Unused eSIMs can be refunded within 24 hours of purchase\n• If you've activated the eSIM, refunds are evaluated case-by-case\n• To request a refund, reply with 'I want a refund' and I'll create a support ticket\n\nNo contracts here - we want you to be happy with DataForEarth!";
    }
    
    if (q.includes('multiple') || q.includes('two esim')) {
      return "Yes! Most modern devices support multiple eSIMs:\n\n• iPhones (XS and newer) support up to 8 stored eSIMs\n• You can have 2 active lines at once (1 physical + 1 eSIM, or 2 eSIMs)\n• Android devices vary - check your device specs\n\nIn the My eSIMs page, you can switch between your plans easily. Great for having a local plan and a backup global plan!";
    }

    return "I'm here to help! I can assist you with:\n\n• Installing and activating eSIMs\n• Troubleshooting connectivity issues\n• Explaining features like Virtual Location\n• Checking data usage and plan details\n• Processing refunds and cancellations\n\nWhat would you like to know more about?";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 via-primary/10 to-background pt-8 pb-12 px-4"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">24/7 Support</h1>
          </div>
          <p className="text-muted-foreground">
            Get instant help from our AI assistant, powered by advanced language models
          </p>
          <Badge variant="secondary" className="mt-3">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Online Now
          </Badge>
        </div>
      </motion.div>

      <div className="container mx-auto max-w-4xl px-4 mt-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chat */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  AI Assistant
                </CardTitle>
                <CardDescription>Ask anything about DataForEarth</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' ? 'bg-primary' : 'bg-muted'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="w-4 h-4 text-primary-foreground" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter>
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 w-full">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Quick Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleSend(question)}
                  >
                    <span className="text-sm">{question}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Help Center */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Help Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <a href="#" className="block text-primary hover:underline">Installation Guide</a>
                <a href="#" className="block text-primary hover:underline">Troubleshooting</a>
                <a href="#" className="block text-primary hover:underline">Billing & Refunds</a>
                <a href="#" className="block text-primary hover:underline">Device Compatibility</a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
