import fs from "node:fs";
import path from "node:path";

interface KnowledgeSection {
  title: string;
  content: string;
  source: string;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this",
  "what", "when", "where", "which", "who", "how",
  "does", "did", "are", "was", "were", "is", "am",
  "can", "could", "would", "should", "will", "about",
  "explain", "tell", "show", "give", "please", "learn",
  "understand", "know", "want", "need", "you", "your",
  "its", "their", "they", "them", "into", "have",
  "has", "had", "not", "but", "also", "all", "any",
  "more", "some", "our", "out", "use", "using",
  "guide", "information", "doesnt", "dont", "snvr",
  "makes", "hey", "hi", "hello", "isnt", "arent"
]);

const SYNONYMS: Record<string, string[]> = {
  swap: ["ghostswap", "exchange", "trading"],
  exchange: ["ghostswap", "swap"],
  trading: ["ghostswap", "swap", "transaction"],
  wallet: ["vault", "addressing"],
  storage: ["vault"],
  secure: ["privacy", "security"],
  security: ["privacy", "confidential"],
  private: ["privacy", "stealth", "confidential"],
  confidential: ["privacy", "stealth"],
  messaging: ["messenger", "messages"],
  chat: ["messenger", "messages"],
  transfer: ["transaction", "payment"],
  send: ["transaction", "payment"],
  fees: ["fee", "cost"],
  rewards: ["reward", "points", "incentives"],
  incentive: ["reward", "points"],
  earning: ["reward", "points"],
  testing: ["beta", "application"],
  apply: ["application", "beta"],
  join: ["application", "beta"],
  nodes: ["node", "relay"],
  network: ["relay", "node"],
  whitepaper: ["architecture", "ecosystem", "overview"],
  technology: ["architecture", "ecosystem"],
  project: ["ecosystem", "overview"],
  roadmap: ["development", "milestone"],
  supply: ["tokenomics", "allocation"],
  token: ["supply", "tokenomics"],
  burn: ["burned", "supply"],
  meta: ["metamask", "signature"],
  reveal: ["disclosure", "access"]
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  const singular: Record<string, string> = {
    rewards: "reward",
    payments: "payment",
    transactions: "transaction",
    fees: "fee",
    nodes: "node",
    applications: "application",
    messages: "message",
    incentives: "incentive",
    testers: "tester",
    wallets: "wallets"
  };

  return normalize(text)
    .split(" ")
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .map(word => singular[word] || word);
}

function expandWords(input: string[]): string[] {
  const expanded = new Set(input);

  for (const word of input) {
    for (const synonym of SYNONYMS[word] || []) {
      expanded.add(synonym);
    }
  }

  return [...expanded];
}

function loadSections(): KnowledgeSection[] {
  const directory = path.join(process.cwd(), "knowledge");

  if (!fs.existsSync(directory)) return [];

  const files = fs.readdirSync(directory)
    .filter(file => file.endsWith(".md"));

  const sections: KnowledgeSection[] = [];

  for (const file of files) {
    const content = fs.readFileSync(
      path.join(directory, file),
      "utf8"
    );

    const chunks = content.split(/(?=^#{2,3}\s+)/m);

    for (const chunk of chunks) {
      const lines = chunk.trim().split("\n");
      const heading = lines[0]?.match(/^#{2,3}\s+(.+)$/);
      const title = heading?.[1]?.trim();
      const body = lines.slice(1).join("\n").trim();

      if (!title || !body) continue;

      sections.push({
        title,
        content: body,
        source: file
      });
    }
  }

  return sections;
}

function buildSearchTerms(question: string, contextTitle?: string): string[] {
  const normalized = normalize(question);
  const terms = words(normalized);

  // Restore useful search terms from the previous conversation topic.
  if (contextTitle) {
    const context = normalize(contextTitle);

    if (context === "what is snvr") {
      terms.push("ecosystem", "overview", "architecture");
    } else {
      terms.push(...context.split(" ").filter(word => word.length > 2));
    }
  }

  if (/^(what is|whats|who is|tell me about|explain)\s+snvr$/.test(normalized)) {
    terms.push("ecosystem", "overview", "architecture");
  }

  if (/why.*private|what makes.*private|privacy/.test(normalized)) {
    terms.push("confidential", "selective", "disclosure", "stealth");
  }

  if (/how can i join|how do i apply|join the beta/.test(normalized)) {
    terms.push("beta", "application", "tester");
  }

  if (/how much.*fee|what.*fee|cost.*swap/.test(normalized)) {
    terms.push("fee", "cost", "swap", "relay");
  }

  if (/how many tokens|total supply|token supply/.test(normalized)) {
    terms.push("supply", "tokenomics", "allocation");
  }

  if (/planning next|plan next|coming next|roadmap|future plans|upcoming features/.test(normalized)) {
    terms.push("roadmap", "future", "development", "upcoming", "heading");
  }

  return expandWords(terms);
}


function getIntentBoost(
  question: string,
  title: string,
  source: string
): number {
  const q = normalize(question);
  const t = normalize(title);

  const matches = (...patterns: RegExp[]) =>
    patterns.some(pattern => pattern.test(q));

  // GhostSwap fees and liquidity providers.
  if (
    matches(/ghostswap/, /swap.*fee/, /fee.*swap/, /liquidity provider/) &&
    matches(/fee/, /fees/, /receive/, /provider/, /ghostswap/)
  ) {
    if (t === "ghostswap") return 100;
  }

  // Relay fees and token burning.
  if (
    /relay/.test(q) &&
    /fee|fees|burn|burned|token|charge|cost/.test(q)
  ) {
    if (t === "relay engine") return 100;
  }

  // Beta applications and joining.
  if (
    /beta|tester|testing/.test(q) &&
    /apply|application|join|become|participate|register|sign up/.test(q)
  ) {
    if (t === "application requirements") return 100;
    if (t === "overview") return 15;
  }

  // Beta rewards and incentives.
  if (
    /beta|tester|testing/.test(q) &&
    /reward|rewards|points|incentive|stablecoin/.test(q)
  ) {
    if (t === "beta rewards") return 100;
  }

  // ROSE gas support.
  if (/rose|gas/.test(q) && /beta|tester|testing/.test(q)) {
    if (t === "rose gas support") return 100;
  }

  // Privacy guarantees and anonymity limitations.
  if (
    /anonymous|anonymity|guarantee|100 percent|completely private|fully private/.test(q)
  ) {
    if (t === "how does snvr protect financial privacy") return 100;
  }

  // Oasis Sapphire.
  if (/oasis sapphire|sapphire/.test(q)) {
    if (t === "what is oasis sapphire") return 120;
    if (t === "how does snvr protect financial privacy") return 30;
  }

  // Selective signed access and wallet control.
  if (
    /reveal|revealing|history|disclosure|signature|metamask/.test(q)
  ) {
    if (t === "how does snvr protect financial privacy") return 100;
  }

  // What problem SNVR solves.
  if (/problem|solve|solving|purpose/.test(q)) {
    if (t === "what is snvr") return 100;
    if (t === "the bigger picture") return 50;
  }

  // Who SNVR is designed for.
  if (/who is snvr built for|who is it for|target audience|who uses snvr/.test(q)) {
    if (t === "who is snvr built for") return 120;
  }

  // SNVR roadmap and future plans.
  if (
    /roadmap|planning next|plan next|coming next|future plans|upcoming/.test(q)
  ) {
    if (t === "where is snvr heading") return 150;
  }

  // General SNVR overview, including alternative phrasings.
  if (/^(what exactly is|what is|whats|who is|tell me about|explain) snvr/.test(q)) {
    if (t === "what is snvr") return 100;
  }

  return 0;
}

export function searchKnowledge(question: string, contextTitle?: string) {
  const sections = loadSections();
  const normalizedQuestion = normalize(question);
  const queryWords = [...new Set(buildSearchTerms(question, contextTitle))];

  if (!sections.length || !queryWords.length) {
    return null;
  }

  const betaQuestion =
    /\b(beta|reward|tester|testing|application|apply|incentive|rose gas)\b/.test(
      normalizedQuestion
    );

  const results = sections.map(section => {
    const normalizedTitle = normalize(section.title);
    const normalizedContent = normalize(section.content);

    const titleWords = new Set(words(section.title));
    const contentWords = new Set(words(section.content));

    const intentBoost = getIntentBoost(question, section.title, section.source);
    let score = intentBoost;
    let matchedTerms = intentBoost > 0 ? 1 : 0;

    // Keep short conversational follow-ups focused on the previous topic.
    if (
      contextTitle &&
      normalize(section.title) === normalize(contextTitle) &&
      /^(more|tell me more|explain more|go on|continue|how does it work|how does that work|what else|elaborate|why|how so)[?.!,\s]*$/i.test(question.trim())
    ) {
      score += 50;
    }

    for (const word of queryWords) {
      if (titleWords.has(word)) {
        score += 8;
        matchedTerms++;
      } else if (contentWords.has(word)) {
        score += 2;
        matchedTerms++;
      }
    }

    if (
      normalizedTitle &&
      normalizedQuestion.includes(normalizedTitle)
    ) {
      score += 12;
    }

    if (matchedTerms >= 3) {
      score += matchedTerms * 1.5;
    }

    if (betaQuestion && section.source === "beta.md") {
      score += 15;
    }

    if (!betaQuestion && section.source === "snvr.md") {
      score += 5;
    }

    if (
      /^(what is|whats|who is|tell me about|explain)\s+snvr$/.test(
        normalizedQuestion
      ) &&
      /what is snvr|overview|bigger picture/i.test(section.title)
    ) {
      score += 15;
    }

    return {
      ...section,
      score,
      matchedTerms,
      normalizedContent
    };
  }).sort((a, b) => b.score - a.score);

  const best = results[0];

  if (!best || best.score < 4 || best.matchedTerms === 0) {
    return null;
  }

  // Keep answers focused instead of returning an entire document section.
  const MAX_LENGTH = 1900;
  let content = best.content.trim();

  if (content.length > MAX_LENGTH) {
    const paragraphs = content.split(/\n\s*\n/);
    let selected = "";

    for (const paragraph of paragraphs) {
      const candidate = selected
        ? `${selected}\n\n${paragraph}`
        : paragraph;

      if (candidate.length > MAX_LENGTH) break;

      selected = candidate;
    }

    content = selected || content.slice(0, MAX_LENGTH).trim();
  }

  return {
    title: best.title,
    content,
    source: best.source
  };
}
