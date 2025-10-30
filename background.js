// ===== Load Markdown knowledge =====
let KB_TEXT = "";
let KB_CHUNKS = []; // [{title, text, tokens, id}]

(async function loadKB() {
  try {
    const txt = await fetch(chrome.runtime.getURL("care_knowledge_en.md")).then(r => r.text());
    KB_TEXT = txt || "";
    KB_CHUNKS = chunkMarkdown(txt);
    console.log("[KB] loaded:", KB_CHUNKS.length, "chunks");
  } catch (e) { console.warn("[KB] load failed:", e); }
})();

// Split markdown into sections by headings and paragraphs
function chunkMarkdown(md) {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const chunks = [];
  let current = { title: "General", text: [] };

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line)) {
      if (current.text.length) {
        chunks.push(finalize(current));
      }
      current = { title: line.replace(/^#{1,6}\s+/, "").trim(), text: [] };
    } else {
      if (line.trim() !== "") current.text.push(line.trim());
    }
  }
  if (current.text.length) chunks.push(finalize(current));
  return chunks;

  function finalize(c) {
    const t = c.text.join(" ");
    return { title: c.title, text: t, tokens: tokenize((c.title + " " + t).toLowerCase()) };
  }
}

// ===== Simple retrieval (keyword + heading boost) =====
const STOP = new Set("a an the and or of in on to for with by from at as is are was were be been being this that these those it its".split(" "));
const SYN = {
  "pressure": ["bedsores","ulcer","ulcers","decubitus","skin breakdown","pressure sore"],
  "ulcer": ["pressure","bedsore","decubitus"],
  "diabetes": ["diabetic","glucose","blood sugar"],
  "mobility": ["exercise","walking","ambulation","range of motion"],
  "fall": ["falls","falling","balance","home safety"],
  "nutrition": ["diet","protein","hydration","feeding"],
  "pain": ["analgesia","discomfort"],
};

function tokenize(s) {
  return s.split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w));
}
function expand(words) {
  const wset = new Set(words);
  for (const w of words) {
    const syns = SYN[w];
    if (syns) syns.forEach(sw => wset.add(sw));
  }
  return Array.from(wset);
}

function retrieve(query, k = 5) {
  if (!KB_CHUNKS.length) return [];
  const qWords = expand(tokenize(query.toLowerCase()));
  const scores = KB_CHUNKS.map((c, idx) => {
    let score = 0;
    for (const q of qWords) {
      if (c.tokens.includes(q)) score += 1;
      if (c.title.toLowerCase().includes(q)) score += 1.5; // heading boost
    }
    // mild length normalization
    score = score / Math.sqrt(50 + c.tokens.length);
    return { idx, score, title: c.title, text: c.text };
  });
  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

// ===== Local Prompt API (Origin Trial) =====
async function callLocalPromptAPI(prompt) {
  const lm = chrome?.aiOriginTrial?.languageModel;
  if (!lm) throw new Error("Local Prompt API namespace not available.");
  const availability = await lm.availability();
  if (availability !== "available") throw new Error("Local model not ready.");
  const session = await lm.create();
  const result = await session.prompt(prompt);
  return result;
}

// ===== Rule-based generator (when model not available) =====
function composeStructuredAnswer(query, hits, opts = { detail: "standard", audience: "family" }) {
  const evidence = hits.map(h => `• ${h.title}: ${truncate(h.text, 220)}`).join("\n");
  const level = opts.detail || "standard";
  const isPro = (opts.audience || "family") === "professional";

  // base checklists for common topics (fallback if KB sparse)
  const topic = inferTopic(query);
  const sections = [];

  // 1) Summary
  sections.push(`## Summary
- Topic: ${topic}
- Audience: ${isPro ? "Professional caregiver" : "Family caregiver"}
- Goal: Provide a practical, risk-aware home-care guide.`);

  // 2) Assessment
  sections.push(`## Initial Assessment (2–5 min)
- Screen risk factors & baseline: condition, mobility, cognition, nutrition, continence.
- Environment check: bed surface, linens, moisture, clutter, lighting.
- Document baseline status.`);

  // 3) Step-by-step Care
  if (topic === "Pressure ulcer prevention") {
    sections.push(`## Step-by-step Daily Care
1. Repositioning: Turn every 2 hours; use 30° lateral tilt; avoid dragging; heels offloaded.
2. Support surfaces: Use pressure-redistributing mattress/foam; keep sheets wrinkle-free.
3. Skin care: Inspect bony prominences twice daily; keep clean & dry; moisture barrier for incontinence.
4. Microclimate: Keep bed dry; change wet linens promptly; avoid overheating.
5. Nutrition & hydration: Ensure adequate protein and fluids; monitor weight weekly.
6. Mobility: Encourage ROM exercises; sit-out with cushion (≤1 hour at a time).
7. Education: Teach family to spot early erythema (non-blanching).`);
  } else if (topic === "Diabetes diet") {
    sections.push(`## Step-by-step Daily Care
1. Plate method: 1/2 non-starch veg, 1/4 lean protein, 1/4 whole grains.
2. Carbohydrate control: Prefer low-GI carbs; distribute carbs across meals; avoid sugary drinks.
3. Monitoring: Check fasting/random glucose as instructed; record values.
4. Hypo management: Always have fast-acting carbs available; follow 15–15 rule.
5. Hydration & fiber: ≥1.5–2L water/day unless contraindicated; ≥25–30g fiber/day.`);
  } else if (topic === "Fall prevention") {
    sections.push(`## Step-by-step Daily Care
1. Home safety: Remove clutter/cables; non-slip mats; night lights; secure rugs.
2. Footwear & aids: Closed-heel shoes; check cane/walker height.
3. Strength & balance: Chair rises, heel raises, tandem stand; 10–15 reps × 2 sets/day.
4. Medications: Review sedatives, hypotensives; measure orthostatic BP if trained.
5. Vision & hearing: Ensure glasses updated; adequate lighting.`);
  }

  // 4) Monitoring
  sections.push(`## Monitoring & Documentation
- Track adherence (repositioning log, glucose log, exercise log).
- Record skin changes, pain, appetite, fluid intake.
- Review weekly; adjust plan as needed.`);

  // 5) Red flags
  sections.push(`## Red Flags (seek medical advice)
- New/worsening pain, fever, spreading redness, foul odor or drainage.
- Rapid weight loss, dehydration, repeated hypoglycemia or hyperglycemia.
- Falls, head injury, acute confusion.`);

  // 6) 120-min Sample Schedule (for detailed mode)
  if (level === "detailed") {
    if (topic === "Pressure ulcer prevention") {
      sections.push(`## Sample 120-min Session (Home Care)
- 0–10 min: Brief assessment; skin check of pressure points.
- 10–35 min: Repositioning routine; bed & linens adjustment; heel offloading.
- 35–55 min: Hygiene & moisture care; apply barrier cream if needed.
- 55–80 min: ROM exercises (ankle pumps, hip/knee flexion/extension).
- 80–95 min: Nutritional support—protein snack, hydration.
- 95–110 min: Education & caregiver coaching; update logs.
- 110–120 min: Environment reset; safety check.`);
    }
  }

  // 7) Evidence (from KB)
  if (evidence) {
    sections.push(`## Retrieved Evidence (from local knowledge)
${evidence}`);
  }

  // 8) Notes
  if (!isPro) {
    sections.push(`## Caregiver Notes
- This guide is educational and not a medical diagnosis.
- If unsure, contact your healthcare professional.`);
  }

  return sections.join("\n\n");
}

function inferTopic(q) {
  const s = q.toLowerCase();
  if (/(pressure|bedsore|ulcer|decubitus|skin breakdown)/.test(s)) return "Pressure ulcer prevention";
  if (/(diabetes|glucose|blood sugar|diet)/.test(s)) return "Diabetes diet";
  if (/(fall|balance|home safety)/.test(s)) return "Fall prevention";
  return "General home care";
}

function truncate(t, n){ return t.length<=n ? t : t.slice(0,n-3)+"..."; }

// ===== Main router =====
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "askAI") return;
  (async () => {
    const { text, options } = msg;
    const hits = retrieve(text, options?.detail === "detailed" ? 8 : 5);
    const retrievedBlock = hits.map(h => `- [${h.title}] ${truncate(h.text, 400)}`).join("\n");

    // If Prompt API available, use it with RAG augmentation
    try {
      const prompt = (retrievedBlock)
        ? `You are an expert home-care assistant. Using the retrieved knowledge below, produce a ${options?.detail || "standard"}-length answer for a ${options?.audience || "family"} caregiver. 
Format the response with clear sections: Summary; Initial Assessment; Step-by-step Care; Monitoring; Red Flags; (if detailed) a 120-min sample session; End with "Caregiver Notes".
Retrieved knowledge:
${retrievedBlock}

Question: ${text}`
        : `You are an expert home-care assistant. Provide a ${options?.detail || "standard"}-length structured answer for a ${options?.audience || "family"} caregiver.
Sections: Summary; Initial Assessment; Step-by-step Care; Monitoring; Red Flags; Caregiver Notes.
Question: ${text}`;

      const answer = await callLocalPromptAPI(prompt);
      sendResponse({ answer });
      return;
    } catch (e) {
      // Fallback: rule-based structured generation (no model)
      const answer = composeStructuredAnswer(text, hits, options);
      sendResponse({ answer });
    }
  })();
  return true; // keep async channel
});