import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const SoniaAssistant = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open Sonia from anywhere
  useEffect(() => {
    const handleOpenSonia = () => {
      setIsOpen(true);
    };
    window.addEventListener('openSonia', handleOpenSonia);
    return () => {
      window.removeEventListener('openSonia', handleOpenSonia);
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: t("sonia.welcome"),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getSoniaResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    const lang = i18n.language;

    // DKIM, SPF, DMARC configuration
    if (
      lowerMessage.includes("dkim") ||
      lowerMessage.includes("spf") ||
      lowerMessage.includes("dmarc") ||
      lowerMessage.includes("configuration") ||
      lowerMessage.includes("dns") ||
      lowerMessage.includes("domaine")
    ) {
      return t("sonia.responses.dkimSpfDmarc");
    }

    // Email sending / Envoi d'emails
    if (
      lowerMessage.includes("envoyer") ||
      lowerMessage.includes("send") ||
      lowerMessage.includes("envoi") ||
      lowerMessage.includes("campagne")
    ) {
      return t("sonia.responses.emailSending");
    }

    // Batch sending / Envoi par lots
    if (
      lowerMessage.includes("lot") ||
          lowerMessage.includes("batch") ||
          lowerMessage.includes("volume") ||
          lowerMessage.includes("10k") ||
          lowerMessage.includes("15k") ||
          lowerMessage.includes("20k")
    ) {
      return t("sonia.responses.batchSending");
    }

    // Deliverability / Délivrabilité
    if (
      lowerMessage.includes("délivrabilité") ||
          lowerMessage.includes("deliverability") ||
          lowerMessage.includes("réputation") ||
          lowerMessage.includes("reputation") ||
          lowerMessage.includes("spam")
    ) {
      return t("sonia.responses.deliverability");
    }

    // Bounces / Rebonds
    if (
      lowerMessage.includes("bounce") ||
          lowerMessage.includes("rebond") ||
          lowerMessage.includes("erreur") ||
          lowerMessage.includes("error")
    ) {
      return t("sonia.responses.bounces");
    }

    // Pricing / Tarifs
    if (
      lowerMessage.includes("prix") ||
          lowerMessage.includes("tarif") ||
          lowerMessage.includes("pricing") ||
          lowerMessage.includes("coût") ||
          lowerMessage.includes("cost")
    ) {
      return t("sonia.responses.pricing");
    }

    // Warmup / Réchauffement
    if (
      lowerMessage.includes("warmup") ||
          lowerMessage.includes("réchauffement") ||
          lowerMessage.includes("réchauffer")
    ) {
      return t("sonia.responses.warmup");
    }

    // Performance / Statistiques
    if (
      lowerMessage.includes("performance") ||
          lowerMessage.includes("statistique") ||
          lowerMessage.includes("taux") ||
          lowerMessage.includes("rate") ||
          lowerMessage.includes("ouverture") ||
          lowerMessage.includes("open")
    ) {
      return t("sonia.responses.performance");
    }

    // Best practices / Bonnes pratiques
    if (
      lowerMessage.includes("bonne pratique") ||
          lowerMessage.includes("best practice") ||
          lowerMessage.includes("conseil") ||
          lowerMessage.includes("tip") ||
          lowerMessage.includes("optimiser") ||
          lowerMessage.includes("optimize")
    ) {
      return t("sonia.responses.bestPractices");
    }

    // Default response
    return t("sonia.responses.default");
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const response = await getSoniaResponse(userMessage.content);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(i18n.language === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-primary hover:bg-primary/90"
        size="icon"
        title="Ask IA"
      >
        <Bot className="h-6 w-6" />
        <span className="sr-only">Ask IA</span>
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    {t("sonia.name")}
                    <Sparkles className="h-4 w-4 text-primary" />
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground font-normal">
                    {t("sonia.subtitle")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1",
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">
                        {user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("sonia.inputPlaceholder")}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="icon"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("sonia.footer")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

