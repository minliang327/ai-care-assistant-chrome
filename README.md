# 🧠 AI Care Assistant  
**Client-side Chrome Extension powered by Gemini Nano and Chrome Built-in AI APIs**

---

## 🌍 Overview
**AI Care Assistant** is a Chrome Extension designed to assist **family and professional caregivers** in delivering high-quality, evidence-informed home care.  
It leverages **Gemini Nano (Prompt API)** and a **local retrieval-augmented generation (RAG)** system to provide structured, privacy-preserving caregiving guidance — entirely on the client side.

This project demonstrates the power of **Chrome’s Built-in AI APIs**, including the **Prompt API**, to bring real-world healthcare support directly to users’ browsers without cloud dependence.

---

## 💡 Problem Statement
Family and professional caregivers often lack accessible, evidence-based care guidance when working offline or in privacy-sensitive environments.  
Traditional AI assistants rely on cloud processing, raising privacy and connectivity issues.  

**AI Care Assistant** solves this by:
- Delivering **local AI caregiving support** using Gemini Nano  
- Ensuring **privacy and offline availability**  
- Providing **context-aware, structured caregiving plans** for various elderly care scenarios  

---

## ⚙️ Features
- 🧩 **Local AI (Prompt API)** — Generates structured, step-by-step caregiving guidance directly in the browser  
- 📚 **Local RAG Knowledge Base** — Retrieves caregiving evidence from embedded markdown (`care_knowledge_en.md`)  
- 🔄 **Automatic Fallback Mode** — If the Prompt API is unavailable, a rule-based generator produces answers  
- 🎨 **Rich UI and Dynamic Output** — Formatted markdown rendering with icons, color themes, and fade-in animations  
- 👥 **Adaptive Role Output** — Responses tailored for either *family caregivers* or *professional caregivers*  
- 🏠 **Home Safety Visuals** — Inserts home fall-prevention checklist images dynamically for family caregivers  
- 🔒 **Privacy by Design** — No data leaves the device; all computation is client-side  
- 🌙 **Dark Mode Ready** — Responsive to user’s system theme preferences  

---

## 🧰 Technologies Used
| Component | Technology |
|------------|-------------|
| Core Model | **Gemini Nano (Prompt API for Chrome)** |
| AI APIs | Chrome Built-in AI (Prompt API) |
| Framework | Plain HTML, CSS, JavaScript (Manifest V3) |
| Architecture | Local RAG retrieval + Prompt API augmentation |
| Knowledge Base | Markdown (`care_knowledge_en.md`) |
| Compatibility | Chrome 127+ (Built-in AI Early Preview) |

---

## 🧠 APIs Used
- **Prompt API** — Core text generation using Gemini Nano  
- (Optional Future Additions)  
  - **Summarizer API** — To summarize caregiving notes  
  - **Proofreader API** — To refine or correct care documentation  

---

## 🖼️ Screenshots
*(Add these after recording your demo video or UI captures)*  
- `popup.html` showing family vs professional mode  
- Example: “How to prevent pressure ulcers?”  
- Evidence toggle and fall-prevention checklist display  

---

## 🧩 Installation
1. Clone or download this repository.  
2. Open Chrome and navigate to `chrome://extensions/`.  
3. Enable **Developer mode** (toggle at top-right).  
4. Click **“Load unpacked”** and select this project’s folder.  
5. The **AI Care Assistant** icon will appear in your toolbar.  
6. Click it to open the popup and try an example query.

---

## ▶️ How to Use
1. Click the **AI Care Assistant** icon in Chrome.  
2. Type a caregiving question (e.g., “How to prevent pressure ulcers?”).  
3. Choose:
   - **Detail level:** Brief / Detailed  
   - **Audience:** Family / Professional  
4. Press **Ask Assistant**  
5. View the structured caregiving plan generated locally.  
6. Optionally expand “📚 Show Evidence” for retrieved sources.  

---

## 🧩 Example Prompts
| Query | Description |
|--------|--------------|
| “How to prevent pressure ulcers?” | Generates skin integrity care plan |
| “What diet suits elderly diabetics?” | Nutrition management guidance |
| “Home fall-prevention checklist?” | Safety steps and visual checklist |

---

## 🔐 Privacy & Ethics
- All AI generation occurs **entirely on the device**.  
- No user data, input, or output is transmitted externally.  
- The app provides educational content only and **does not replace medical advice**.  

---

## 🧩 Repository Structure
📂 AI Care Assistant
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── care_knowledge_en.md
├── Img/
│   ├── fall-prevention-1.png
│   ├── fall-prevention-2.png
│   ├── fall-prevention-3.png
│   ├── fall-prevention-4.png
│   ├── fall-prevention-5.png
└── README.md

---

## 🧠 Future Improvements
- Integrate **Summarizer API** and **Proofreader API**
- Add **multilingual support** (Translator API)
- Store query history and user preferences with `chrome.storage.local`
- Generate daily care plans (Writer API)
- Export outputs to `.pdf` or `.txt`  

---

## 📜 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 📹 Demo Video
👉 *(To be added)*  
Once ready, upload your demo (≤3 minutes) to **YouTube or Vimeo** and link it here:  
`https://youtu.be/your-demo-link`

---

## 👩‍⚕️ Author
**Min Liang**  
Fudan University — School of Nursing  
Focus: Community-based long-term care, AI for caregiver empowerment  

---

## 🌟 Acknowledgments
This project was developed for the **Google Chrome Built-in AI Challenge 2025**, showcasing the potential of client-side AI to empower caregivers and improve community health outcomes.

---

## 🧱 Architecture Diagram
```text
┌───────────────────────────────────────────────┐
│                 🧠 AI Care Assistant          │
│         (Chrome Extension – Manifest V3)      │
└───────────────────────────────────────────────┘
                  │
                  ▼
        ┌───────────────────────────┐
        │         Popup UI          │
        │ (popup.html / popup.js)   │
        │ ─ User input (question)   │
        │ ─ Select detail/audience  │
        │ ─ Render structured reply │
        └───────────────────────────┘
                  │
                  │  chrome.runtime.sendMessage()
                  ▼
        ┌───────────────────────────┐
        │     Background Service    │
        │        (background.js)    │
        │ ─ Retrieve local KB       │
        │ ─ Call Prompt API (Gemini)│
        │ ─ Fallback: rule-based    │
        │ ─ Compose structured MD   │
        └───────────────────────────┘
                  │
                  ▼
        ┌───────────────────────────┐
        │  Local Knowledge Base     │
        │  (care_knowledge_en.md)   │
        │ ─ Markdown sections       │
        │ ─ Tokenize & retrieve     │
        └───────────────────────────┘
                  │
                  ▼
        ┌───────────────────────────┐
        │   Chrome Built-in AI      │
        │     (Gemini Nano)         │
        │ ─ via Prompt API          │
        │ ─ Runs locally on-device  │
        └───────────────────────────┘
                  │
                  ▼
        ┌───────────────────────────┐
        │     Structured Output     │
        │ ─ Summary                 │
        │ ─ Step-by-step Care       │
        │ ─ Red Flags               │
        │ ─ Evidence Section        │
        └───────────────────────────┘
