import { Bot, InlineKeyboard, Context } from "grammy";
import "dotenv/config";
import { searchKnowledge } from "./knowledge.js";

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing. Add it to your .env file.");
}

const bot = new Bot(token);

// Remember the last topic for each active chat.
const lastTopics = new Map<number, string>();

const progressiveTopics: Record<string, string> = {
  "What is SNVR?": "What is Oasis Sapphire?",
  "What is Oasis Sapphire?": "Who is SNVR built for?",
  "Who is SNVR built for?": "How does the SNVR ecosystem work?",
  "How does the SNVR ecosystem work?": "SNVR Messenger",
  "SNVR Messenger": "GhostSwap",
  "GhostSwap": "SNVR Vault",
  "SNVR Vault": "Relay Engine",
  "Relay Engine": "How does SNVR protect financial privacy?",
  "How does SNVR protect financial privacy?": "SNVR Tokenomics",
  "SNVR Tokenomics": "Where is SNVR heading?",
  "Where is SNVR heading?": "The Bigger Picture"
};

function isExpansionRequest(message: string): boolean {
  return /^(more|tell me more|explain more|go deeper|go on|continue|what else|elaborate|expand on that|more details)[?.!,\s]*$/i.test(message.trim());
}


function isBeginnerRequest(message: string): boolean {
  return /^(i'?m new|im new|i am new|teach me snvr|teach me about snvr|start from zero|start from scratch|explain snvr simply|i'?m a beginner|beginner mode)[?.,!\s]*$/i.test(message.trim());
}

const mainMenu = new InlineKeyboard()
  .text("🌐 Discover SNVR", "discover").row()
  .text("🔐 Privacy Explained", "privacy").row()
  .text("💬 SNVR Messenger", "messenger").row()
  .text("👻 GhostSwap", "ghostswap").row()
  .text("🔄 Relay Engine", "relay").row()
  .text("🏦 SNVR Vault", "vault").row()
  .text("🧪 Beta Testing", "beta").row()
  .text("🎁 Beta Rewards", "rewards").row()
  .text("📖 Whitepaper Explorer", "whitepaper").row()
  .text("🌍 Official Socials", "socials").row()
  .text("💬 Ask SNVR Nova", "ask");

const socialsMenu = new InlineKeyboard()
  .url("Official X", "https://x.com/SNVROfficial").row()
  .url("Telegram Community", "https://t.me/SNVRCommunity").row()
  .url("Official Website", "https://snvr.org/").row()
  .url("Beta Application", "https://snvr.org/apply").row()
  .text("⬅️ Main Menu", "back");

const topics: Record<string, string> = {
  discover: "What is SNVR and what is its ecosystem?",
  privacy: "Explain SNVR privacy and security architecture.",
  messenger: "Explain SNVR Messenger.",
  ghostswap: "Explain GhostSwap.",
  relay: "Explain the SNVR Relay Engine.",
  vault: "Explain SNVR Vault.",
  beta: "Explain SNVR beta testing dates, application and requirements.",
  rewards: "Explain SNVR beta rewards, points and gas incentives.",
  whitepaper: "Explain the SNVR whitepaper and its main components."
};

async function acknowledge(ctx: Context) {
  try {
    await ctx.answerCallbackQuery();
  } catch {
    // Ignore expired callback queries.
  }
}

function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|yo)[!.?,\s]*$/i.test(message);
}

function isFollowUp(message: string): boolean {
  const text = message.trim().toLowerCase();

  return (
    /^(how does it work|how does that work|tell me more|explain more|go on|continue|what about that|why|how so|and then|what else|can you explain|elaborate)[?.!,\s]*$/i.test(text) ||
    /^(what about|and|also|does it|can it|is it|how about|what are its|what is its|does that|can that|is that|who receives|who gets|where does|why does|how much does|what happens to)\b/i.test(text) ||
    /\b(its|their|those|these|that|they|them)\b/i.test(text)
  );
}
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatForTelegram(content: string): string {
  return content.split("\n").map(line => {
    let formatted = escapeHtml(line.trim());
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    formatted = formatted.replace(/^#{1,3}\s+(.+)$/, "<b>$1</b>");
    formatted = formatted.replace(/^[-*]\s+/, "• ");
    return formatted;
  }).join("\n").trim();
}

async function sendKnowledge(
  ctx: Context,
  question: string,
  contextTitle?: string
) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const result = searchKnowledge(question, contextTitle);

  if (!result) {
    await ctx.reply(
      "I couldn't find enough verified information about that in my current SNVR knowledge base.\n\n" +
      "Try asking about SNVR, privacy, Messenger, GhostSwap, Vault, Relay Engine, beta testing or rewards."
    );
    return;
  }

  lastTopics.set(chatId, result.title);

  const cleanContent = result.content.trim();

  await ctx.reply(
    "<b>" + escapeHtml(result.title) + "</b>\n\n" + formatForTelegram(cleanContent),
    { parse_mode: "HTML" }
  );
}
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Welcome to SNVR Sidekick!\n\n" +
    "I'm your conversational guide to the SNVR ecosystem.\n\n" +
    "Ask me questions naturally. You don't need special commands.\n\n" +
    "For example:\n" +
    "• What is SNVR?\n" +
    "• Explain GhostSwap.\n" +
    "• How does the Vault work?\n" +
    "• How can I join the beta?\n\n" +
    "Or explore the menu below.\n\n" +
    "⚠️ Independent, unofficial community guide. Not operated or endorsed by SNVR.",
    { reply_markup: mainMenu }
  );
});

bot.command("menu", async (ctx) => {
  await ctx.reply("📚 Explore the SNVR ecosystem:", {
    reply_markup: mainMenu
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "🤖 SNVR Sidekick Commands\n\n" +
    "/start - Start the guide\n" +
    "/menu - Open the menu\n" +
    "/discover - Discover SNVR\n" +
    "/privacy - Privacy explained\n" +
    "/messenger - SNVR Messenger\n" +
    "/ghostswap - GhostSwap\n" +
    "/relay - Relay Engine\n" +
    "/vault - SNVR Vault\n" +
    "/beta - Beta testing\n" +
    "/rewards - Beta rewards\n" +
    "/whitepaper - Whitepaper topics\n" +
    "/socials - Official links\n" +
    "/ask - Ask a question\n\n" +
    "You can also simply type your question."
  );
});

bot.command("ask", async (ctx) => {
  const question = ctx.match?.trim();

  if (question) {
    await sendKnowledge(ctx, question);
  } else {
    await ctx.reply("💬 What would you like to know about SNVR?");
  }
});

bot.command("socials", async (ctx) => {
  await ctx.reply("🌍 SNVR Official Links:", {
    reply_markup: socialsMenu
  });
});

// Register topic commands automatically.
for (const [key, question] of Object.entries(topics)) {
  bot.command(key, async (ctx) => {
    await sendKnowledge(ctx, question);
  });

  bot.callbackQuery(key, async (ctx) => {
    await acknowledge(ctx);
    await sendKnowledge(ctx, question);
  });
}

bot.callbackQuery("ask", async (ctx) => {
  await acknowledge(ctx);
  await ctx.reply("💬 Ask me anything about the SNVR ecosystem.");
});

bot.callbackQuery("socials", async (ctx) => {
  await acknowledge(ctx);
  await ctx.reply("🌍 SNVR Official Links:", {
    reply_markup: socialsMenu
  });
});

bot.callbackQuery("back", async (ctx) => {
  await acknowledge(ctx);
  await ctx.reply("📚 Main Menu:", {
    reply_markup: mainMenu
  });
});

// Conversational message handling.
bot.on("message:text", async (ctx) => {
  const message = ctx.message.text.trim();

  if (!message || message.startsWith("/")) return;

  if (isGreeting(message)) {
    await ctx.reply(
      "Hey there! 👋 Welcome to SNVR Sidekick.\n\n" +
      "I can help you explore SNVR, its technology, privacy features, beta programme and more.\n\n" +
      "What's on your mind?"
    );
    return;
  }

  if (isBeginnerRequest(message)) {
    await ctx.reply(
      "Absolutely! 👋 Let's learn SNVR from the beginning.\n\n" +
      "I'll guide you through the ecosystem one topic at a time. " +
      "Whenever you're ready for the next lesson, just type More."
    );

    await sendKnowledge(ctx, "What is SNVR?");
    return;
  }

  // Handle multiple questions sent on separate lines.
  const separateQuestions = message.split(/\n+|(?<=[?!.])\s+(?=(?:what|who|how|why|where|when|can|does|is|are|tell|explain)\b)/i).map(q => q.trim()).filter(Boolean);

  if (separateQuestions.length > 1) {
    for (const question of separateQuestions) {
      const previousTopic = lastTopics.get(ctx.chat.id);
      const followUp = Boolean(previousTopic && isFollowUp(question));

      await sendKnowledge(
        ctx,
        question,
        followUp ? previousTopic : undefined
      );
    }
    return;
  }

  const previousTopic = lastTopics.get(ctx.chat.id);

  // Move to the next knowledge section when the user requests more detail.
  if (previousTopic && isExpansionRequest(message)) {
    const nextTopic = progressiveTopics[previousTopic];

    if (nextTopic) {
      await sendKnowledge(ctx, nextTopic);
      return;
    }

    await ctx.reply(
      "We've covered the main sections on this topic. Ask me a specific question and I'll explain it further."
    );
    return;
  }

  const followUp = Boolean(previousTopic && isFollowUp(message));

  await sendKnowledge(
    ctx,
    message,
    followUp ? previousTopic : undefined
  );
});

// Register Telegram's native command menu.
async function startBot() {
  await bot.api.setMyCommands([
    { command: "start", description: "Start SNVR Sidekick" },
    { command: "menu", description: "Explore SNVR" },
    { command: "discover", description: "Discover SNVR" },
    { command: "privacy", description: "Understand SNVR privacy" },
    { command: "messenger", description: "Explore SNVR Messenger" },
    { command: "ghostswap", description: "Learn about GhostSwap" },
    { command: "relay", description: "Explore Relay Engine" },
    { command: "vault", description: "Learn about SNVR Vault" },
    { command: "beta", description: "Beta testing information" },
    { command: "rewards", description: "Beta rewards information" },
    { command: "whitepaper", description: "Explore whitepaper topics" },
    { command: "socials", description: "Official SNVR links" },
    { command: "ask", description: "Ask SNVR Sidekick" },
    { command: "help", description: "Show available commands" }
  ]);

  console.log("SNVR Sidekick is starting...");

  await bot.start();
}

bot.catch((err) => {
  // Do not print the entire error context because it can contain credentials.
  const message = err.error instanceof Error
    ? err.error.message
    : String(err.error);

  console.error("Bot update error:", message);
});

startBot().catch((error) => {
  console.error("Bot startup failed:", error.message);
});
