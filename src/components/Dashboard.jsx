import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, DollarSign, Coins, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(
          "https://ttipl-globalconnect.com:5600/whatsapp/conversations"
        );
        const data = await res.json(); 

        // 🔥 Flatten conversations into single array
        const allMessages = Object.values(data.conversations || {}).flat();
        setMessages(allMessages);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ⏳ Loading state
  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard…</div>;
  }

  // ===================== ANALYTICS =====================
  const totalMessages = messages.length;
  const incomingMessages = messages.filter((m) => m.direction === "in").length;
  const outgoingMessages = messages.filter((m) => m.direction === "out").length;

  const totalInputTokens = messages.reduce(
    (sum, m) => sum + (m.input_tokens || 0),
    0
  );
  const totalOutputTokens = messages.reduce(
    (sum, m) => sum + (m.output_tokens || 0),
    0
  );

  const totalLLMCostUSD = messages.reduce(
    (sum, m) => sum + (m.llm_cost_usd || 0),
    0
  );
  const totalLLMCostINR = messages.reduce(
    (sum, m) => sum + (m.llm_cost_inr || 0),
    0
  );
  const totalWhatsAppCost = messages.reduce(
    (sum, m) => sum + (m.whatsapp_cost || 0),
    0
  );

  const totalCostINR = totalLLMCostINR + totalWhatsAppCost;

  // ===================== UI STATS =====================
  const stats = [
    {
      title: "Total Messages",
      value: totalMessages,
      description: `${incomingMessages} incoming, ${outgoingMessages} outgoing`,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Tokens",
      value: (totalInputTokens + totalOutputTokens).toLocaleString(),
      description: `${totalInputTokens.toLocaleString()} input, ${totalOutputTokens.toLocaleString()} output`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "LLM Cost",
      value: `₹${totalLLMCostINR.toFixed(2)}`,
      description: `$${totalLLMCostUSD.toFixed(4)} USD`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "WhatsApp Cost",
      value: `₹${totalWhatsAppCost.toFixed(2)}`,
      description: `Total: ₹${totalCostINR.toFixed(2)}`,
      icon: Coins,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Overview of your WhatsApp bot analytics
        </p>
      </div>

      {/* ================= STATS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================= COST BREAKDOWN ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Detailed cost analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-medium">LLM Processing Cost</p>
              <p className="text-xs text-gray-500">AI usage</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">
                ₹{totalLLMCostINR.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                ${totalLLMCostUSD.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="flex justify-between p-4 bg-orange-50 rounded-lg">
            <div>
              <p className="font-medium">WhatsApp Cost</p>
              <p className="text-xs text-gray-500">Outgoing messages</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-orange-700">
                ₹{totalWhatsAppCost.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{outgoingMessages} sent</p>
            </div>
          </div>

          <div className="flex justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div>
              <p className="font-semibold">Total Cost</p>
              <p className="text-xs text-gray-600">All expenses</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-700">
                ₹{totalCostINR.toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">
                ${(totalLLMCostUSD + totalWhatsAppCost / 84).toFixed(4)} USD
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
