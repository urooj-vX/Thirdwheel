# THIRD WHEEL

> **Receipts, not vibes.**

**A private memory companion for the conversations that matter.**

---

[![Watch Third Wheel Demo](https://img.shields.io/badge/Demo-Watch%20Video-C85A32?style=for-the-badge&logo=youtube)](YOUTUBE_URL)
[![Live Demo](https://img.shields.io/badge/Live-Render%20Deployment-FEF8E0?style=for-the-badge&logo=render&logoColor=18181B)](RENDER_URL)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-18181B?style=for-the-badge&logo=github)](https://github.com/urooj-vX/ThirdWheel)

![Third Wheel Main Landing Page](./public/illustrations/main%20page.png)

---

## 1. The Story

I built **Third Wheel** for my uncle.

One day he asked me a question about my life. The next day, he asked me the exact same question. A few conversations later, it happened again. 

What I realized I was losing was not the person, but the **continuity between our conversations**. Over time, details blur, memory gets messy, and assumptions take over. We start remembering what we *think* happened rather than what was actually said.

Third Wheel was created to solve this human problem: to serve as a private, evidence-backed memory companion that preserves conversation continuity and grounds memories in concrete facts.

> **Remember what happened. Not what you think happened.**

---

## 2. Core Philosophy

Third Wheel operates on a simple premise:

1. **What I know** (Verified facts & direct statements)
2. **What I'm assuming** (Interpretations & unverified expectations)
3. **What I don't know** (Gaps, missing context, and explicit uncertainties)

> *"Memory without provenance is just another form of hallucination."*

Most conversational AI assistants are optimized to sound confident, even when they are guessing. Third Wheel takes the opposite approach: **it prefers uncertainty over fabricated certainty**. When stored evidence is missing, weak, or conflicting, Third Wheel explicitly tells you so rather than inventing intent.

---

## 3. What It Does

Third Wheel provides an end-to-end memory environment for the people in your life:

* **Private Person Memory Spaces**: Every person has a dedicated workspace isolated by strict `user_id` and `person_id` scoping.
* **Text Conversation Ingestion**: Paste raw chat transcripts, message snippets, or personal notes.
* **Browser Voice Input**: Record audio directly in the composer with one click via the `MediaRecorder API` and `Deepgram`.
* **Structured Memory Extraction**: AI automatically extracts facts, events, open threads, assumptions, and uncertainties.
* **Evidence Scoping & Retrieval**: All memory queries and searches pull exclusively from receipts belonging to the active person.
* **Conversational Memory Questions**: Ask about past plans, promises, dates, documents, and errands.
* **Reality Check**: Run an evidence audit on any question to evaluate whether a conclusion is backed by hard facts or unverified assumptions.
* **Persisted Audit Records**: Historical Reality Checks are saved to the database, allowing instant thread restoration without re-running model calls.

---

## 4. Product Screenshots & Workflows

### Your People Gallery
Organize active connections, archived records, and trash with custom relationship labels and receipt counts.

![Your People Dashboard](./public/illustrations/your%20people.png)

### Person Chat Workspace & Reality Check
Ask questions about past conversations, view structured evidence receipts, and audit conclusions.

![Person Chat Workspace & Reality Check](./public/illustrations/demo%20user.png)

---

## 5. Main Use Cases

* **Family Conversations**: Keep track of details shared by older family members, medical updates, or family stories.
* **Promises & Commitments**: Remember who promised to send documents, buy tickets, or bring items by Sunday.
* **Errands & Appointments**: Store dates, time slots, locations, and logistical notes discussed across past chats.
* **Fact vs. Assumption Auditing**: Verify whether you actually agreed to a plan or merely assumed it.
* **Quick Voice Logging**: Record a quick voice summary right after a conversation ends.

---

## 6. Reality Check: How Evidence Auditing Works

When you run a **Reality Check** in Third Wheel, the system performs a multi-stage audit:

```
[ User Question ]
       │
       ▼
[ Person-Scoped Retrieval ] ─── (Pull receipts for active person_id only)
       │
       ▼
[ AI Fact / Assumption / Unknown Breakdown ]
       │
       ▼
[ Evidence Strength Evaluation ] ─── (INSUFFICIENT | WEAK | MODERATE | STRONG)
       │
       ▼
[ Cautious Conclusion + Next Action Recommendation ]
```

### Reality Check Output Components:
* **Known Facts**: Verifiable receipts with direct quotes.
* **Assumptions**: Unverified expectations or interpretations.
* **Unknowns**: Missing information required to give a definitive answer.
* **Evidence Strength**: Quantitative rating of stored receipt backing.
* **Suggested Next Action**: Pragmatic recommendations (e.g., *"Ask Rakesh directly about the time slot"*).

---

## 7. Voice Input with Deepgram

Third Wheel incorporates seamless voice input directly inside the message composer:

1. **Recording**: Click the microphone icon to capture audio via the browser's native `MediaRecorder API`.
2. **Transcription**: Audio blobs are sent to **Deepgram (`nova-3` model)** via a server action REST endpoint.
3. **User Control**: The returned transcript is placed directly into the text composer.
4. **Editable**: The user can review, edit, or append to the text before clicking **Send**. Audio files are never stored on disk or in the database.

---

## 8. Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT UI                                 │
│  (Landing Story / People Gallery / Person Chat Workspace / Voice Mic)  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
             Typed Text                             Voice Audio
                    │                                │
                    ▼                                ▼
       [ Ingestion Pipeline ]             [ Deepgram REST API ]
                    │                        (nova-3 STT)
                    │                                │
                    ├────────────────────────────────┘
                    │
                    ▼
       [ AI Extraction Provider ]
       (Gemini / Gemma Fallback Chain)
                    │
                    ▼
       [ Zod Schema Validation & Repair ]
                    │
                    ▼
       [ MongoDB Storage ] ─── (Strict user_id + person_id Isolation)
                    │
       ┌────────────┴────────────┐
       ▼                         ▼
 [ Memory Repository ]    [ Reality Check Persistence ]
```

---

## 9. Engineering Challenges & Solutions

* **Making LLM Outputs Trustworthy**: Generic models hallucinate when context is thin. Third Wheel uses strict Zod schemas and prompt constraints to force the model to categorize unverified statements as `assumptions` or `uncertainty`.
* **Robust Provider Fallbacks**: If the primary AI provider times out or hits a rate limit, the fallback chain automatically shifts from `gemini-3.6-flash` to `gemini-3.5-flash-lite` or `gemini-3.8-flash` within a strict 25-second deadline.
* **Multi-Tenant Isolation**: Memory documents and search queries enforce dual-index filtering on both `user_id` and `person_id` to prevent cross-person context leakage.
* **Zero-Recomputation Historical Restoration**: Reality Check records are stored as complete documents in MongoDB. Re-opening a past chat thread reconstructs the full audit UI instantly without consuming additional API tokens.

---

## 10. Testing & Reliability

The repository maintains an automated test suite executed via Vitest:

* **13 Test Files**
* **49 Passing Tests**

```bash
npm test
```

### Test Coverage Areas:
* **AI Output Validation & Repair**: Malformed JSON recovery and schema bounds.
* **Provider Fallback & Timeouts**: Fallback behavior when primary models fail.
* **Person Isolation**: Multi-tenant database boundary verification.
* **Ingestion & Extraction**: Extraction of facts vs. assumptions vs. uncertainties.
* **Reality Check Persistence**: Storing and restoring historical audits.
* **Voice Transcription**: Deepgram REST action handling and fallback error paths.
* **UI Smoke Tests**: Rendering state transitions and interactive controls.

> *"49 automated tests covering the parts of Third Wheel that should never be left to chance."*

---

## 11. Open Innovation: Swappable Provider Architecture

Third Wheel decouples application logic from single-vendor AI dependencies:

* **Provider Abstraction Layer**: The codebase uses a unified model provider contract (`AIProvider`).
* **Open-Weight Model Path**: Supports **Gemma (`gemma-4-31b-it`)** as a candidate open-weight provider path.
* **Live Hackathon Deployment**: Uses **Gemini** (`gemini-3.6-flash` / `gemini-3.5-flash-lite`) as the primary live provider for optimal low-latency response times during competition judging.
* **Future Local Inference**: The architecture allows swapping in on-device open-weight models (e.g., via Ollama or local vLLM) without changing UI components or database repositories.

---

## 12. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Actions) |
| **Language** | TypeScript (Strict mode) |
| **Frontend UI** | React 18, Tailwind CSS, Vanilla CSS, Lucide Icons |
| **Animations** | GSAP (ScrollTrigger) |
| **Database** | MongoDB (Driver v6) |
| **AI Providers** | Google Gemini API (`gemini-3.6-flash`, `gemini-3.5-flash-lite`), Gemma (`gemma-4-31b-it`) |
| **Voice STT** | Deepgram REST API (`nova-3`) |
| **Validation** | Zod (Runtime schema enforcement) |
| **Testing** | Vitest, MongoMemoryServer |
| **Deployment** | Render |

---

## 13. Getting Started

### Prerequisites
* Node.js v18+ 
* MongoDB instance (local MongoDB server or hosted MongoDB connection string)
* Gemini API Key
* Deepgram API Key (optional for voice transcription)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/urooj-vX/ThirdWheel.git
   cd ThirdWheel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory (do NOT commit this file):

   ```env
   # AI Model Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   USE_REAL_GEMMA=false
   GEMMA_MODEL_NAME=gemma-4-31b-it

   # Deepgram Voice Input (Optional)
   DEEPGRAM_API_KEY=your_deepgram_api_key_here

   # Database Connection
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB_NAME=thirdwheel
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run Tests**:
   ```bash
   npm test
   ```

---

## 14. Project Structure

```
ThirdWheel/
├── public/
│   └── illustrations/       # Editorial SVG/PNG assets & screenshots
├── src/
│   ├── app/
│   │   ├── actions/         # Server actions (ingest, person, reality-check, transcribe)
│   │   ├── layout.tsx       # Root layout & global styling
│   │   └── page.tsx         # Main application controller (Landing / Gallery / Chat)
│   ├── components/          # UI components (Hero, Gallery, Chat, Modals, Audit)
│   ├── config/              # Motion parameters & model fallback lists
│   ├── lib/
│   │   ├── ai/              # AI providers, prompt builders, schema repairs
│   │   ├── retrieval/       # Scoped memory context retrieval algorithms
│   │   └── validation/      # Zod validation contracts
│   ├── repositories/        # MongoDB data access layers (Person, Memory, RealityCheck)
│   └── types/               # TypeScript interfaces & domain schemas
├── tests/                   # Vitest unit, integration, and benchmark suites
├── vitest.config.ts         # Vitest configuration
└── package.json             # Dependencies and build scripts
```

---

## 15. Deployment

Third Wheel is configured for deployment on **Render**:

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**: Set `GEMINI_API_KEY`, `DEEPGRAM_API_KEY`, and `MONGODB_URI` in the Render environment settings dashboard.

---

## 16. Hackathon Context

Developed as a solo entry emphasizing:
* **Practical AI**: Solves a real-world human problem (conversation memory & continuity).
* **Open Innovation**: Decoupled provider architecture supporting open-weight model paths.
* **Privacy & Provenance**: Strict data isolation and evidence-backed audits instead of AI hallucinations.

---

## 17. Lessons Learned

* **Controlling Model Scope**: The hardest part of building AI memory wasn't getting the model to speak—it was enforcing what the model was *allowed* to claim.
* **Provenance Matters**: Separating facts, assumptions, and uncertainties upfront prevents downstream hallucinations.
* **Test Rigor**: Rigorous unit tests on fallback paths and Zod schema parsing ensure reliability under API timeouts and quota limits.

---

## 18. Future Roadmap

* [ ] **On-Device Local Inference**: Support local Gemma execution via WebGPU / Ollama for complete offline privacy.
* [ ] **Memory Editing & Corrections**: User interface controls to convert unverified assumptions into confirmed facts.
* [ ] **Structured Document Imports**: Bulk import past conversation exports (WhatsApp, Email, iMessage).
* [ ] **Long-Term Memory Search**: Semantic vector search across multi-year conversation archives.

---

## 19. Links

* **GitHub Repository**: [https://github.com/urooj-vX/ThirdWheel](https://github.com/urooj-vX/ThirdWheel)
* **Live Demo**: [Live Demo on Render](RENDER_URL)
* **Demo Video**: [Watch Third Wheel Demo Video](YOUTUBE_URL)

---

## 20. Author

**Solo-built by Urooj Naqvi**
* **GitHub**: [@urooj-vX](https://github.com/urooj-vX)
