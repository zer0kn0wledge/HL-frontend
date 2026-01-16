import Anthropic from "@anthropic-ai/sdk";

// ============================================
// Types
// ============================================

export interface Trade {
  id: string;
  market: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
  timestamp: number;
  fees: number;
}

export interface TradeAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  patterns: string[];
  suggestions: string[];
  qualityScore: number;
  sentiment: "bullish" | "bearish" | "neutral";
  riskAssessment: "low" | "medium" | "high";
}

export interface JournalEntry {
  tradeId: string;
  analysis: TradeAnalysis;
  userNotes?: string;
  tags: string[];
  createdAt: number;
}

// ============================================
// Claude Client
// ============================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Trade Analysis
// ============================================

export async function analyzeTradeWithClaude(
  trade: Trade,
  history: Trade[]
): Promise<TradeAnalysis> {
  const prompt = `You are an expert trading analyst specializing in perpetual futures on Hyperliquid. Analyze this trade and provide insights.

TRADE DATA:
- Market: ${trade.market}
- Side: ${trade.side.toUpperCase()}
- Entry: $${trade.entryPrice.toLocaleString()}
- Exit: $${trade.exitPrice.toLocaleString()}
- Size: $${trade.size.toLocaleString()}
- PnL: $${trade.pnl.toLocaleString()} (${trade.pnlPercent > 0 ? "+" : ""}${trade.pnlPercent.toFixed(2)}%)
- Duration: ${trade.duration}
- Leverage: ${trade.leverage}x
- Fees: $${trade.fees.toFixed(2)}

RECENT HISTORY (last 10 trades):
${
  history.length > 0
    ? history
        .slice(0, 10)
        .map(
          (t) =>
            `- ${t.market} ${t.side.toUpperCase()}: ${t.pnlPercent > 0 ? "+" : ""}${t.pnlPercent.toFixed(2)}% ($${t.pnl.toFixed(2)})`
        )
        .join("\n")
    : "No previous trades"
}

STATISTICS:
- Win Rate: ${calculateWinRate(history)}%
- Average Win: ${calculateAvgWin(history)}%
- Average Loss: ${calculateAvgLoss(history)}%
- Profit Factor: ${calculateProfitFactor(history)}

Provide analysis in the following JSON format:
{
  "summary": "1-2 sentence summary of the trade",
  "strengths": ["what went well - 2-3 points"],
  "weaknesses": ["what could improve - 2-3 points"],
  "patterns": ["patterns noticed compared to history - 1-2 points"],
  "suggestions": ["actionable suggestions for future trades - 2-3 points"],
  "qualityScore": 0-100,
  "sentiment": "bullish" | "bearish" | "neutral",
  "riskAssessment": "low" | "medium" | "high"
}

Only respond with valid JSON, no markdown or extra text.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const analysis = JSON.parse(text) as TradeAnalysis;
    return analysis;
  } catch (error) {
    console.error("Failed to analyze trade with Claude:", error);

    // Return default analysis on error
    return {
      summary: "Unable to analyze trade at this time.",
      strengths: [],
      weaknesses: [],
      patterns: [],
      suggestions: ["Try again later"],
      qualityScore: 50,
      sentiment: "neutral",
      riskAssessment: "medium",
    };
  }
}

// ============================================
// Batch Analysis
// ============================================

export async function analyzeMultipleTrades(
  trades: Trade[]
): Promise<{ overall: string; recommendations: string[] }> {
  if (trades.length === 0) {
    return {
      overall: "No trades to analyze.",
      recommendations: [],
    };
  }

  const prompt = `You are an expert trading analyst. Analyze this batch of ${trades.length} trades and provide overall insights.

TRADES:
${trades
  .map(
    (t, i) =>
      `${i + 1}. ${t.market} ${t.side.toUpperCase()}: ${t.pnlPercent > 0 ? "+" : ""}${t.pnlPercent.toFixed(2)}% ($${t.pnl.toFixed(2)}) - ${t.duration}`
  )
  .join("\n")}

SUMMARY STATS:
- Total Trades: ${trades.length}
- Win Rate: ${calculateWinRate(trades)}%
- Total PnL: $${trades.reduce((sum, t) => sum + t.pnl, 0).toFixed(2)}
- Best Trade: ${Math.max(...trades.map((t) => t.pnlPercent)).toFixed(2)}%
- Worst Trade: ${Math.min(...trades.map((t) => t.pnlPercent)).toFixed(2)}%
- Most Traded: ${getMostTraded(trades)}

Provide:
1. Overall assessment (2-3 sentences)
2. 3-5 specific recommendations

Respond in JSON format:
{
  "overall": "assessment here",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to analyze trades batch:", error);
    return {
      overall: "Unable to analyze trades at this time.",
      recommendations: [],
    };
  }
}

// ============================================
// Market Sentiment Analysis
// ============================================

export async function analyzeMarketSentiment(
  market: string,
  recentTrades: Trade[]
): Promise<{
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  reasoning: string;
}> {
  const marketTrades = recentTrades.filter((t) => t.market === market);

  const prompt = `Analyze the trading activity for ${market} perpetual futures.

RECENT ACTIVITY:
- Total trades: ${marketTrades.length}
- Long trades: ${marketTrades.filter((t) => t.side === "long").length}
- Short trades: ${marketTrades.filter((t) => t.side === "short").length}
- Win rate on longs: ${calculateWinRateBySide(marketTrades, "long")}%
- Win rate on shorts: ${calculateWinRateBySide(marketTrades, "short")}%

Based on this activity, what is the likely sentiment?

Respond in JSON:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to analyze market sentiment:", error);
    return {
      sentiment: "neutral",
      confidence: 50,
      reasoning: "Unable to analyze at this time.",
    };
  }
}

// ============================================
// Helper Functions
// ============================================

function calculateWinRate(trades: Trade[]): string {
  if (trades.length === 0) return "0";
  const wins = trades.filter((t) => t.pnl > 0).length;
  return ((wins / trades.length) * 100).toFixed(1);
}

function calculateAvgWin(trades: Trade[]): string {
  const wins = trades.filter((t) => t.pnl > 0);
  if (wins.length === 0) return "0";
  const avg = wins.reduce((sum, t) => sum + t.pnlPercent, 0) / wins.length;
  return avg.toFixed(2);
}

function calculateAvgLoss(trades: Trade[]): string {
  const losses = trades.filter((t) => t.pnl < 0);
  if (losses.length === 0) return "0";
  const avg = losses.reduce((sum, t) => sum + t.pnlPercent, 0) / losses.length;
  return avg.toFixed(2);
}

function calculateProfitFactor(trades: Trade[]): string {
  const grossProfit = trades
    .filter((t) => t.pnl > 0)
    .reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0)
  );
  if (grossLoss === 0) return grossProfit > 0 ? "∞" : "0";
  return (grossProfit / grossLoss).toFixed(2);
}

function getMostTraded(trades: Trade[]): string {
  const counts: Record<string, number> = {};
  trades.forEach((t) => {
    counts[t.market] = (counts[t.market] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "N/A";
}

function calculateWinRateBySide(
  trades: Trade[],
  side: "long" | "short"
): string {
  const sideTrades = trades.filter((t) => t.side === side);
  if (sideTrades.length === 0) return "0";
  const wins = sideTrades.filter((t) => t.pnl > 0).length;
  return ((wins / sideTrades.length) * 100).toFixed(1);
}
