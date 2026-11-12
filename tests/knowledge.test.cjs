const assert = require("node:assert/strict");
require("tsx/cjs");

const { searchKnowledge } = require("../src/knowledge.ts");

const cases = [
  ["What problem is SNVR trying to solve?", "What is SNVR?"],
  ["Who is SNVR built for?", "Who is SNVR built for?"],
  ["What is Oasis Sapphire?", "What is Oasis Sapphire?"],
  ["Who receives the swap fees?", "GhostSwap"],
  ["How can I become an SNVR beta tester?", "Application Requirements"],
  ["Can SNVR guarantee 100% anonymity?", "How does SNVR protect financial privacy?"],
  ["Does revealing my history give anyone control of my wallet?", "How does SNVR protect financial privacy?"],
  ["What is the Relay Engine?", "Relay Engine"],
  ["What are the beta rewards?", "Beta Rewards"],
  ["How much ROSE do beta testers receive?", "ROSE Gas Support"]
];

let passed = 0;

for (const [question, expected] of cases) {
  const result = searchKnowledge(question);

  try {
    assert.ok(result, "No answer returned");
    assert.equal(result.title, expected);

    console.log("✅ PASS:", question);
    passed++;
  } catch (error) {
    console.log("❌ FAIL:", question);
    console.log("   Expected:", expected);
    console.log("   Received:", result?.title || "NO MATCH");
  }
}

console.log(`\nRESULT: ${passed}/${cases.length} tests passed.`);

if (passed !== cases.length) {
  process.exitCode = 1;
}
