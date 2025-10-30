document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("userInput");
  const askBtn = document.getElementById("askBtn");
  const output = document.getElementById("output");
  const detail = document.getElementById("detail");
  const audience = document.getElementById("audience");

  // --- Evidence 控件 ---
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "toggleEvidence";
  toggleBtn.textContent = "📚 Show evidence";
  Object.assign(toggleBtn.style, {
    display: "none",
    marginTop: "8px",
    width: "100%",
    padding: "4px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "12px",
    color: "#374151",
  });

  const evidenceBox = document.createElement("div");
  evidenceBox.id = "evidenceBox";
  Object.assign(evidenceBox.style, {
    display: "none",
    marginTop: "6px",
    padding: "6px 8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    background: "#f3f4f6",
  });

  output.insertAdjacentElement("afterend", toggleBtn);
  toggleBtn.insertAdjacentElement("afterend", evidenceBox);

  // 示例问题点击
  document.querySelectorAll(".example").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.textContent;
      askBtn.click();
    });
  });

  askBtn.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) {
      output.innerHTML = "<i>Please enter or select a question.</i>";
      return;
    }

    output.innerHTML = "<span style='color:#2563eb;'>Thinking...</span>";
    evidenceBox.style.display = "none";
    toggleBtn.style.display = "none";

    chrome.runtime.sendMessage(
      { type: "askAI", text, options: { detail: detail.value, audience: audience.value } },
      (response) => {
        try {
          if (chrome.runtime.lastError) {
            output.innerHTML =
              "<span style='color:red;'>Error:</span> " +
              chrome.runtime.lastError.message;
            return;
          }

          let raw = (response?.answer || "No response.").trim();
          if (!raw) {
            output.innerHTML = "<i>No response.</i>";
            return;
          }

          const splitPoint = raw.indexOf("## Retrieved Evidence");
          let mainPart = raw;
          let evidencePart = "";
          if (splitPoint !== -1) {
            mainPart = raw.slice(0, splitPoint).trim();
            evidencePart = raw.slice(splitPoint).trim();
          }

          mainPart = filterSections(mainPart, detail.value, audience.value, text);
          output.innerHTML = formatMarkdownToHTML(mainPart);

          if (evidencePart) {
            evidenceBox.innerHTML = formatMarkdownToHTML(evidencePart);
            toggleBtn.style.display = "block";
            toggleBtn.textContent = "📚 Show evidence";
            evidenceBox.style.display = "none";
          }
        } catch (err) {
          console.error("Popup.js Error:", err);
          output.innerHTML =
            "<span style='color:red;'>Render Error:</span> " + err.message;
        }
      }
    );
  });

  // 展开 / 折叠 Evidence
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "toggleEvidence") {
      const vis = evidenceBox.style.display === "block";
      evidenceBox.style.display = vis ? "none" : "block";
      e.target.textContent = vis ? "📚 Show evidence" : "📕 Hide evidence";
    }
  });

  // --- 内容过滤逻辑 ---
  function filterSections(md, detail, audience, question) {
    if (!md) return "";

    if (detail === "brief") {
      if (audience === "professional") {
        const parts = [
          extractSection(md, "## Step-by-step"),
          ensureSession(md, question),
        ].filter(Boolean);
        return parts.join("\n\n");
      }

      if (audience === "family") {
        const parts = [extractSection(md, "## Step-by-step")].filter(Boolean);
        parts.push(defaultSuggestion());
        return parts.join("\n\n");
      }
    }

    if (audience === "family") {
      const parts = [
        extractSection(md, "## Summary"),
        extractSection(md, "## Step-by-step"),
        extractSection(md, "## Red Flags"),
      ].filter(Boolean);
      parts.push(defaultSuggestion());
      return parts.join("\n\n");
    }

    if (audience === "professional") {
      // 保证每个专业回答都有 Session 部分
      let base = md;
      if (!md.includes("## Sample 120-min")) {
        base += "\n\n" + ensureSession(md, question);
      }
      return base;
    }

    return md;
  }

  // --- 智能 Session 生成（根据问题类别提示不同）---
  function ensureSession(md, question) {
    // 已存在 session 段落
    if (md.includes("## Sample 120-min")) {
      return extractSection(md, "## Sample 120-min");
    }

    // 根据问题关键词给不同说明
    const q = question.toLowerCase();
    if (q.includes("ulcer") || q.includes("skin")) {
      return `## Sample 120-min Session (Home Care)
- 0–15 min: Skin inspection and pressure relief setup.
- 15–45 min: Repositioning and hygiene care.
- 45–75 min: Dressing or barrier application.
- 75–105 min: ROM exercises for mobility.
- 105–120 min: Documentation and safety review.`;
    }
    if (q.includes("nutrition") || q.includes("feeding")) {
      return `## Sample 120-min Session (Home Care)
- 0–15 min: Assess appetite and hydration.
- 15–45 min: Meal preparation and assisted feeding.
- 45–70 min: Rest and digestion monitoring.
- 70–100 min: Record intake, provide oral hygiene.
- 100–120 min: Nutritional education and cleanup.`;
    }
    if (q.includes("fall") || q.includes("rehabilitation")) {
      return `## Sample 120-min Session (Home Care)
- 0–15 min: Check vitals, set exercise goals.
- 15–60 min: Guided mobility or transfer training.
- 60–90 min: Balance and strength exercises.
- 90–110 min: Monitor fatigue, adjust difficulty.
- 110–120 min: Review and feedback.`;
    }
    if (q.includes("diabetics") || q.includes("insulin")) {
      return `## Sample 120-min Session (Home Care)
- 0–10 min: Glucose monitoring.
- 10–40 min: Insulin administration and observation.
- 40–80 min: Nutrition management and exercise planning.
- 80–100 min: Recordkeeping and safety check.
- 100–120 min: Education and next-day plan.`;
    }

    // 默认提示而非模板
    return `## Sample 120-min Session (Home Care)
Session planning depends on the care task and patient condition.`;
  }

  function defaultSuggestion() {
    return `## Suggestion
- Recommended hospital: Community Health Service Center.
- Outpatient Department: Geriatric or Rehabilitation Clinic.
- Hotline: 12320 (Health Advisory).`;
  }

  // --- 段落提取 ---
  function extractSection(md, title) {
    try {
      const regex = new RegExp(title + "[\\s\\S]*?(?=(\\n## |$))", "i");
      const match = md.match(regex);
      return match ? match[0].trim() : "";
    } catch {
      return "";
    }
  }

  // --- Markdown 渲染 ---
  function formatMarkdownToHTML(md) {
    if (!md) return "";
    md = md.replace(/^[\s\n]+|[\s\n]+$/g, "");
    md = md.replace(/\r/g, "").replace(/\n{2,}/g, "\n");

    let html = md
      .replace(/^## (.+)$/gm, "<h3>$1</h3>")
      .replace(/^### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
      .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/•\s?/g, "<br>• ")
      .replace(/\n/g, "");

    html = html
      .replace(/<h3>Summary.*?<\/h3>/gi, "<h3 style='color:#2563eb;'>📋 Summary</h3>")
      .replace(/<h3>Step-by-step.*?<\/h3>/gi, "<h3 style='color:#7c3aed;'>🩺 Step-by-step Care</h3>")
      .replace(/<h3>Sample 120-min.*?<\/h3>/gi, "<h3 style='color:#9333ea;'>⏱️ 120-min Session (Home Care)</h3>")
      .replace(/<h3>Red Flags.*?<\/h3>/gi, "<h3 style='color:#dc2626;'>⚠️ Red Flags</h3>")
      .replace(/<h3>Suggestion.*?<\/h3>/gi, "<h3 style='color:#0284c7;'>🏥 Suggestion</h3>")
      .replace(/<h3>Retrieved Evidence.*?<\/h3>/gi, "<h3 style='color:#475569;'>📚 Evidence</h3>");

    const style = `
      <style>
        .formatted-answer {
          margin-top: 0;
          padding-top: 0;
          word-break: break-word;
          white-space: normal;
          line-height: 1.35;
        }
        .formatted-answer h3 {
          margin-top: 6px;
          margin-bottom: 2px;
          font-size: 14px;
          font-weight: 600;
        }
        .formatted-answer ul {
          margin: 0 0 3px 16px;
          padding: 0;
        }
        .formatted-answer li {
          line-height: 1.3;
          margin: 0;
          padding: 0;
        }
      </style>
    `;
    return `${style}<div class="formatted-answer">${html}</div>`;
  }
  // ✅ 在输出渲染后插入家庭防跌倒配图
  const observer = new MutationObserver(() => {
    if (audience.value === "family" && output.innerHTML.includes("🩺 Step-by-step Care")) {
      insertFallPreventionImages();
      observer.disconnect(); // 只执行一次
    }
  });
  observer.observe(output, { childList: true, subtree: true });

  // --- 家庭照护者配图模块 ---
  function insertFallPreventionImages() {
    const container = document.createElement("div");
    container.style.marginTop = "10px";
    container.style.textAlign = "center";

    const title = document.createElement("h4");
    title.textContent = "🏠 Home Fall-Prevention Checklist";
    title.style.marginBottom = "6px";
    title.style.color = "#374151";

    const images = [
      { src: "Img/fall-prevention-1.png", caption: "Home safety" },
      { src: "Img/fall-prevention-2.png", caption: "Footwear & aids" },
      { src: "Img/fall-prevention-3.png", caption: "Strength & balance" },
      { src: "Img/fall-prevention-4.png", caption: "Medications" },
      { src: "Img/fall-prevention-5.png", caption: "Vision & hearing" },
    ];

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, 1fr)";
    grid.style.gap = "6px";
    grid.style.justifyItems = "center";

    images.forEach((item) => {
      const card = document.createElement("div");
      card.style.textAlign = "center";

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.caption;
      img.style.width = "100px";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      img.style.marginBottom = "3px";

      const cap = document.createElement("div");
      cap.textContent = item.caption;
      cap.style.fontSize = "11px";
      cap.style.color = "#4b5563";

      card.appendChild(img);
      card.appendChild(cap);
      grid.appendChild(card);
    });

    container.appendChild(title);
    container.appendChild(grid);
    output.appendChild(container);
  }
  // ✅ 全局淡入动画效果
  const styleFade = document.createElement("style");
  styleFade.textContent = `
    .fade-in {
      opacity: 0;
      transform: translateY(8px);
      animation: fadeInUp 0.6s ease-out forwards;
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(styleFade);

  // ✅ 当输出内容更新后，为主要模块添加淡入效果
  const fadeObserver = new MutationObserver(() => {
    const blocks = output.querySelectorAll(
      "h3, h4, ul, li, div, img, button"
    );
    blocks.forEach((el, i) => {
      // 延迟递进，提升层次感
      el.style.animationDelay = `${Math.min(i * 0.05, 0.4)}s`;
      el.classList.add("fade-in");
    });
  });
  fadeObserver.observe(output, { childList: true, subtree: true });
});