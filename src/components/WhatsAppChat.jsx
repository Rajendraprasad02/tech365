import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Phone, ArrowLeft } from "lucide-react";

export default function WhatsAppChat() {
  const [conversations, setConversations] = useState({});
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          "https://ttipl-globalconnect.com:5600/whatsapp/conversations"
        );
        const data = await res.json();

        setConversations(data.conversations || {});
        const numbers = Object.keys(data.conversations || {});
        setSelectedNumber(numbers[0] || null);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const phoneNumbers = Object.keys(conversations);
  const currentMessages = selectedNumber ? conversations[selectedNumber] : [];

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatPhoneNumber = (number) =>
    number.startsWith("91")
      ? `+91 ${number.slice(2, 5)} ${number.slice(5, 8)} ${number.slice(8)}`
      : number;

  if (loading) {
    return <div className="p-6 text-gray-500">Loading conversations...</div>;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden p-4 ">
      {/* ================= SIDEBAR ================= */}
      <div
        className={`
          w-full md:w-72 lg:w-80 
          border-r bg-white flex flex-col rounded-2xl
          ${selectedNumber ? "hidden md:flex" : "flex"}
        `}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Contacts
          </h2>
          <p className="text-sm text-gray-500">
            {phoneNumbers.length} conversation(s)
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {phoneNumbers.map((number) => {
              const messages = conversations[number];
              const lastMessage = messages[messages.length - 1];

              return (
                <div
                  key={number}
                  onClick={() => setSelectedNumber(number)}
                  className={`p-3 rounded-lg cursor-pointer ${
                    selectedNumber === number
                      ? "bg-green-600 text-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>{number.slice(-2)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <p className="font-semibold truncate">
                          {formatPhoneNumber(number)}
                        </p>
                        <Badge variant="outline">{messages.length}</Badge>
                      </div>
                      <p className="text-xs truncate opacity-80">
                        {lastMessage?.message?.slice(0, 40)}…
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* ================= CHAT AREA ================= */}
      {selectedNumber && (
        <div className="flex-1 flex flex-col bg-white rounded-xl mx-2">
          {/* Header */}
          <div className="bg-green-600 text-white p-3 flex items-center gap-3 rounded-2xl">
            {/* Mobile back */}
            <button
              className="md:hidden"
              onClick={() => setSelectedNumber(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <Avatar>
              <AvatarFallback className="bg-white text-green-600">
                {selectedNumber.slice(-2)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="font-semibold">
                {formatPhoneNumber(selectedNumber)}
              </h3>
              <p className="text-sm opacity-80">
                {currentMessages.length} messages
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-2 md:p-6 bg-gray-50">
            <div className="space-y-4">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.direction === "out" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow ${
                      msg.direction === "out"
                        ? "bg-green-500 text-white"
                        : "bg-white border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>

                    <div className="text-xs mt-2 opacity-80 flex gap-2 items-center">
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.direction === "out" && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <MessageCircle className="h-3 w-3" />
                        </>
                      )}
                    </div>

                    {(msg.llm_cost_inr > 0 || msg.whatsapp_cost > 0) && (
                      <div className="text-xs mt-2 pt-2 border-t opacity-80">
                        {msg.llm_cost_inr > 0 && (
                          <span className="mr-3">
                            LLM: ₹{msg.llm_cost_inr.toFixed(2)}
                          </span>
                        )}
                        {msg.whatsapp_cost > 0 && (
                          <span>WA: ₹{msg.whatsapp_cost.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
