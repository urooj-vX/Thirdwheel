Yes. At this point I would stop treating this as a random hackathon idea and treat it as a real product with a very specific user, a very specific pain point, and a deliberately engineered AI architecture.

The project we have arrived at is much stronger than the original “AI dating assistant” idea. The core concept is a private, person-separated dating/social memory and decision assistant—working name Third Wheel, with the tagline “Receipts, not vibes.” The central story is that your friend repeatedly comes to you with screenshots, copied messages, and long explanations about different people she is talking to, asking things like “What does he mean?”, “Does he like me?”, “Should I reply?”, “What did I tell you about this guy?”, and “Am I overthinking this?” You are effectively becoming her manual relationship database. The hackathon project turns that recurring real-life problem into software: instead of trying to guarantee that she finds a boyfriend, the system helps her organize the people she is talking to, remember what actually happened, separate facts from assumptions, retrieve previous interactions, and make decisions without constantly needing another human to analyze every screenshot. This fits the challenge unusually well because the official prompt is specifically to build something with open-source AI at its core for a real friend, and the judging emphasizes writing quality, relevance to the theme, creativity, technical execution, and partner technology.

One very important distinction: Third Wheel should not be marketed as “AI that gets my friend a boyfriend.” That's a weak and almost impossible promise. You cannot objectively prove that your AI “found” someone for her, and there are already many generic AI dating/coaching concepts. The more interesting problem is social uncertainty + fragmented memory + overthinking. Humans routinely take a tiny amount of evidence—“he viewed my story,” “he replied after six hours,” “he said maybe Saturday,” “he used a different emoji”—and construct an enormous narrative around it. Your product can explicitly separate what happened, what she thinks happened, what the evidence supports, and what remains unknown. That gives you a much more intellectually interesting product: not an AI that pretends to read another person's mind, but an AI that helps the user reason about incomplete social information.

1. The product in one sentence

I would describe it as:

Third Wheel is a private AI companion that keeps a separate memory for every person you're talking to and helps you distinguish dating facts from assumptions before you spiral—or call your friend for the 17th screenshot analysis.

Or, for the hackathon:

I built an AI because I was tired of receiving screenshots.

Then:

Third Wheel — Receipts, not vibes.

That is the story.

2. The most important feature: separate profile for every person

Your new idea about creating a separate virtual personality/profile for every person is absolutely something you can build, and I actually think this should become the architectural foundation of the entire application.

Suppose your friend is talking to three people:

Arjun

met at college
likes football
talked about coffee
usually messages at night

Rahul

met through Instagram
likes gaming
studying finance
had one date

Sameer

met at an event
likes music
hasn't spoken much yet

The application should never treat all of this as one giant conversational memory.

Instead, every person gets their own isolated Person Memory Space.

Conceptually:

                    THIRD WHEEL
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
          ARJUN        RAHUL       SAMEER
             │           │           │
        ┌────┼────┐  ┌───┼────┐  ┌───┼────┐
        ▼    ▼    ▼  ▼   ▼    ▼  ▼   ▼    ▼
      chats facts events chats facts events ...

So if your friend asks:

“What did he say about football?”

the application knows which person is currently active and searches that person's memory.

If she switches to Rahul:

“What did he say about Saturday?”

the retrieval context changes to Rahul.

This is essentially an entity-scoped memory system. That sounds much more senior than simply saying “I gave the chatbot memory.”

3. The profile isn't just a fake personality

I would actually avoid internally calling it a “virtual personality,” because technically you're doing something more interesting.

You're creating a persistent, evidence-backed representation of a person.

For example:

ARJUN
────────────────────────

Status:
Talking

Known facts:
• Studies CS
• Likes football
• Likes Arsenal
• Usually free on weekends

Interests:
⚽ Football
🎵 Indie music

Conversation patterns:
• Usually replies at night
• Has initiated 4 conversations
• Asked about weekend plans twice

Open threads:
• Sunday football match
• Coffee discussion

Recent interactions:
• Oct 2 — College
• Oct 1 — Instagram
• Sept 29 — First conversation

Uncertainties:
• Does he actually want to meet?

The crucial word here is evidence.

The system should know where it learned something.

For example:

Fact:
Arjun likes football.

Source:
Interaction #17

Date:
October 2

Confidence:
High

Then your friend can ask:

“Why does Third Wheel think Arjun likes football?”

And the application can answer:

“You mentioned it during your October 2 conversation.”

That is a much better memory architecture than blindly allowing an LLM to accumulate facts.

4. How does the data actually get into the system?

This is the question you correctly raised.

You don't need WhatsApp access.

You don't need to scrape Instagram.

You don't need access to her accounts.

In fact, I would deliberately avoid that.

The friend should explicitly provide information to the application.

Give her three ingestion methods.

Method 1 — Screenshot

She gets:

Him: “haha yeah maybe we should get coffee sometime”

She takes a screenshot.

She uploads it.

Third Wheel:

Screenshot
    ↓
OCR
    ↓
Conversation extraction
    ↓
Speaker identification
    ↓
Person association
    ↓
Memory extraction
    ↓
Profile update

The system might extract:

Person: Arjun

Interaction:
Suggested getting coffee.

Potential open thread:
Coffee

Evidence:
Screenshot #12

Confidence:
High

This is probably your best hackathon demo because everyone immediately understands it.

5. Method 2 — Paste the conversation

She can copy a conversation:

Me: what are you doing tonight?
Him: probably watching the match
Me: which one?
Him: Arsenal
Me: oh nice

She pastes it into:

Add interaction

Then:

Analyze

The system extracts:

Arjun
────────────────

New information:
• Watches football
• Supports Arsenal

Conversation:
• Football discussed

Potential future context:
• Football is a known interest

Again, this goes only into Arjun's memory.

6. Method 3 — “Tell me what happened”

This is potentially the most useful feature for real life.

Instead of requiring structured data, she can simply write:

“Okay so today I met him at college. He asked what I was doing this weekend and then we talked for around 20 minutes. He said he likes football and he's going to a match on Sunday. I told him I've never been to one.”

Third Wheel converts that into structured information:

PERSON
Arjun

INTERACTION
Oct 2

LOCATION
College

DURATION
~20 minutes

NEW FACTS
• Likes football
• Going to a match Sunday

CONVERSATION
• Asked about weekend
• Discussed football

OPEN THREAD
• Sunday match

This is where your LLM becomes genuinely useful: unstructured human narration → structured personal memory.

7. The core feature: “Receipts, not vibes”

This should be the central product philosophy.

Suppose she says:

“He definitely doesn't like me anymore.”

Third Wheel doesn't say:

“Yes, he doesn't like you.”

And it shouldn't say:

“Don't worry, he definitely likes you!”

Both are pretending to know something the evidence doesn't establish.

Instead:

FACT

He hasn't replied for six hours.

INTERPRETATION

“He's losing interest.”

ASSUMPTION

“He's talking to another girl.”

OTHER POSSIBILITIES

He is busy.
He hasn't checked his phone.
He doesn't know how to respond.
His interest may have changed.

EVIDENCE

Currently insufficient.

ACTION

No action required yet.

That is your product.

8. “Reality Check”

I would make this a dedicated button.

User:

“He viewed my story but hasn't replied for five hours.”

Third Wheel:
REALITY CHECK

What we know:
✓ He viewed your story
✓ 5 hours have passed

What we don't know:
? Why he hasn't replied
? Whether he is busy
? Whether his interest changed

Evidence strength:
LOW

Conclusion:
There isn't enough evidence to
infer romantic intent.

Recommended action:
DO NOTHING.

Then, because this is your friend's app:

Go drink water. 😂

That gives the product personality without turning it into a ridiculous AI therapist.

9. “Should I Text Him?”

This is another major feature.

The friend can paste:

“heyy what are you doing?”

Third Wheel can look at the relevant person's history and say something like:

Your message is normal. You don't need to optimize it further.

Or, more importantly:

You've initiated the last six conversations. If your goal is to understand whether he will independently initiate, waiting may provide more information than sending another message.

Notice the difference.

The application isn't trying to manipulate the other person.

It is helping the user understand her own behavior and the available evidence.

10. The “Don't Text Him” button

This can be a fun but useful feature.

She types:

“I want to text my ex.”

Third Wheel asks:

Why do you want to text him?

○ I miss him
○ I'm lonely
○ I genuinely want to reconnect
○ I saw something that reminded me of him
○ I want validation
○ Other

If she chooses:

“I'm lonely.”

Then:

Maybe don't text him tonight.

This isn't about moralizing. It's about forcing the user to distinguish impulse from intention.

11. The dating memory system

Each person should have a chronological timeline.

For example:

ARJUN

Sept 29
First interaction
↓
Oct 1
Instagram conversation
↓
Oct 2
Met at college
↓
Oct 2
Football conversation
↓
Oct 3
Saturday plans

Clicking an event should show:

original input
extracted facts
source screenshot/message
generated interpretation
confidence
changes to the person's memory

This makes the system auditable.

12. Don't just store facts—store provenance

This is one of the features I most strongly recommend.

Every extracted fact should have:

fact
source
timestamp
confidence
person_id
interaction_id

So:

{
  "person_id": "arjun_123",
  "fact": "Likes football",
  "source": "interaction_17",
  "created_at": "2026-10-02",
  "confidence": 0.93
}

This prevents the AI from becoming an unreliable oracle.

The product can say:

“I know this because you told me this on October 2.”

rather than:

“I remember that he likes football.”

That distinction is important.

13. User-controlled memory correction

Another feature I would definitely implement:

AI says:

⚽ Arjun likes football.

User:

That's Rahul.

Buttons:

Move to Rahul

Delete

Correct

The system updates the memory.

This leads to a very strong product principle:

The AI doesn't own your memory. You do.

That's a genuinely good design philosophy for a personal AI.

14. “Switch Person” is critical

Imagine she has three active conversations.

She is talking about Rahul and asks:

“What did he say about his exam?”

The AI should only retrieve Rahul's memory.

Then she switches:

Arjun

Now the same question is scoped to Arjun.

Technically:

User
 ↓
Active Person
 ↓
Person-specific retrieval
 ↓
Relevant memories
 ↓
LLM context
 ↓
Answer

This reduces cross-person hallucination and is one of the most interesting technical aspects of your project.

15. Friend Burnout

This is your hilarious meta-feature.

The system can optionally track how often she asks the AI for reassurance:

THIS WEEK

Dating-related questions       47
Screenshot analyses            18
"Does he like me?"              11
"Should I text him?"             9
Emergency debriefs              7

Then:

You've spent a lot of mental energy on dating this week.

Or:

Maybe stop analyzing and go do something else. ❤️

The important thing is that this shouldn't shame the user. It's just a fun reflection mechanism.

And this is where your personal story becomes incredibly strong:

“I love my friend. But I was becoming an unpaid relationship analyst.”

That is the kind of opening sentence people remember.

16. Dating Experiment

We discussed another potentially powerful feature: instead of trying to “find a boyfriend,” Third Wheel can help the user run a 14-day social experiment.

For example:

14-DAY EXPERIMENT

Goal:
Meet more people without overthinking.

Targets:
□ Start 2 conversations
□ Attend 1 social activity
□ Talk to someone new
□ Avoid asking friends to analyze every message
□ Notice who initiates naturally

At the end:

You met 4 new people.

You initiated 3 conversations.

2 conversations continued naturally.

You rejected one person because you weren't interested.

You spent less time analyzing ambiguous messages.

That is much more interesting than a “dating score.”

17. What you should NOT build

I would deliberately avoid:

Tinder clone
AI boyfriend finder
AI pickup-line generator
compatibility score
“90% chance he likes you”
fake psychological diagnosis
scraping WhatsApp
automatic messaging
impersonating the user
manipulating someone into liking her
massive dating recommendation engine

Those turn your beautiful friend-specific problem into a generic dating product.

The product is about:

memory + evidence + uncertainty + reflection + decision support.

18. Architecture I would use

Now let's move to the senior-engineering part.

I'd structure the system roughly like this:

                         USER
                           │
              ┌────────────┼────────────┐
              │            │            │
          Screenshot      Text       Story
              │            │            │
              └────────────┼────────────┘
                           ▼
                    INGESTION LAYER
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
             OCR       Text Parser   Metadata
              │            │            │
              └────────────┼────────────┘
                           ▼
                   ENTITY RESOLUTION
                           │
                     person_id
                           │
                           ▼
                   MEMORY EXTRACTION
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
          Facts         Events       Open Threads
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                   MEMORY STORE
                           │
                  ┌────────┴────────┐
                  ▼                 ▼
             Structured DB     Vector Search
                  │                 │
                  └────────┬────────┘
                           ▼
                    RETRIEVAL ENGINE
                           │
                    Active person_id
                           │
                           ▼
                     GEMMA / LLM
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
          Reality       Memory        Suggested
           Check       Answer          Action

That's a legitimate AI application architecture.

19. Database architecture

I'd use MongoDB Atlas.

Something conceptually like:

users
  └── user_id

persons
  ├── person_id
  ├── user_id
  ├── name
  ├── status
  ├── created_at
  └── metadata

interactions
  ├── interaction_id
  ├── person_id
  ├── raw_content
  ├── source_type
  ├── timestamp
  └── media_reference

memories
  ├── memory_id
  ├── person_id
  ├── type
  ├── content
  ├── confidence
  ├── source_interaction_id
  └── created_at

events
  ├── event_id
  ├── person_id
  ├── interaction_id
  ├── event_type
  └── timestamp

open_threads
  ├── thread_id
  ├── person_id
  ├── topic
  ├── status
  └── last_updated

embeddings
  ├── memory_id
  ├── person_id
  └── vector

This makes MongoDB Atlas Vector Search naturally relevant because you can retrieve semantically related memories from a specific person's memory space. The hackathon explicitly lists MongoDB Atlas as a $100 partner category and specifically allows Atlas Vector Search, long-term memory, or using Atlas as the data layer for an open-weight-model application.

20. RAG architecture

Don't simply dump the entire person's history into the LLM.

When she asks:

“What did Arjun say about Saturday?”

retrieve:

person_id = arjun

+
semantic similarity

+
recent interactions

+
open threads

+
relevant facts

Then construct a context:

ACTIVE PERSON:
Arjun

RELEVANT FACTS:
...

RECENT INTERACTIONS:
...

OPEN THREADS:
...

USER QUESTION:
"What did he say about Saturday?"

Then send only that context to the model.

This is exactly the sort of context engineering problem that skills.sh has dedicated skills for: controlling what information the agent sees and when, rather than blindly feeding everything into the context window.

21. Model choice

For the hackathon, I would make Gemma your primary model.

This is extremely important because the challenge has a $200 Best Use of Gemma featured category, and the official description specifically allows running Gemma locally, fine-tuning it, or serving it through Google Cloud/another provider.

You could use Gemma for:

conversation analysis
structured extraction
memory creation
fact/assumption classification
summarization
reality checks
person-memory updates
generating natural-language responses

The strongest story is:

Private-first dating memory.

If you can make the core inference local, even better.

22. Privacy should be a first-class feature

This application deals with potentially very sensitive conversations.

Your design should therefore be:

User chooses what enters the system.

Not:

“Give us your WhatsApp login.”

The public demo should use:

your friend's explicit consent
anonymized names
dummy screenshots where necessary
no exposed phone numbers
no profile photos of third parties
no public publication of private conversations

And you can make privacy part of your open-source argument:

“The most intimate context in your life shouldn't automatically become another company's dataset.”

That's a much more compelling reason for local/open AI than simply:

“I used Gemma because the challenge required it.”

The challenge explicitly asks participants to explain what open innovation made possible—privacy, local execution, model swapping, cost, fine-tuning, etc.

23. Your partner-prize strategy

This is where I'd be very deliberate.

The current Weekend Challenge has:

Featured — $200
Render
TabPFN
Tinker
Arduino
DigitalOcean
Gemma
Partner — $100
Backboard
ElevenLabs
Entire
GitHub Copilot
Mastra
MongoDB Atlas
Sentry Agent Tracing
SerpApi
Temporal
Tiger Data

The rules say a project can enter every category it genuinely qualifies for, although one submission can only win once.

So I would not cram 16 products into your app.

Instead, build around the technologies that naturally strengthen the project.

🥇 Category 1 — Gemma — $200
Absolutely use this.

Role:

Core intelligence / local inference.

Use Gemma for:

Screenshot/text
     ↓
Extraction
     ↓
Memory generation
     ↓
Reality check
     ↓
Response

This should be one of the core technologies, not a decorative API call.

Category: Best Use of Gemma — $200.

🥈 Category 2 — MongoDB Atlas — $100
Absolutely use this.

This is almost tailor-made for your project.

Use Atlas for:

person profiles
interactions
memories
events
open threads
vector search
long-term memory

The official category explicitly supports Atlas Vector Search and long-term memory.

Your article can say:

“Every person has an isolated memory namespace, and MongoDB Atlas Vector Search retrieves relevant evidence without mixing contexts.”

That's a real technical use.

🥉 Category 3 — Sentry Agent Tracing — $100
I would use this too.

Don't merely install Sentry.

Trace:

User input
 ↓
OCR
 ↓
Entity resolution
 ↓
Memory extraction
 ↓
Embedding
 ↓
MongoDB retrieval
 ↓
Gemma
 ↓
Reality check

Then show:

latency
errors
failed extraction
model response time
retrieval time
token/cost information where available

The category specifically asks participants to show the agent's work, performance and debugging through traces/screenshots.

This makes your technical article much stronger.

4 — Render — potentially $200

This one is attractive.

The challenge's Render category allows using Render as the AI runtime, hosting an agent frontend, or running Hermes/OpenClaw.

You could deploy your backend/agent infrastructure there.

But I would only claim Best Use of Render if the Render deployment is genuinely meaningful to the architecture.

For example:

Frontend
   ↓
Render
   ↓
Agent/API
   ↓
Gemma / memory system
   ↓
MongoDB

Don't deploy a static landing page to Render and call it “Best Use.”

5 — DigitalOcean — potentially $200

This is another potentially valuable category.

The official category allows hosting/deploying the project on DigitalOcean, running an open-weight model on a GPU Droplet, or using the Gradient AI Platform.

If Gemma inference is too heavy locally for your demo, you could potentially use a DigitalOcean GPU environment.

But there is a strategic choice:

Privacy-first story

Local Gemma.

Infrastructure story

DigitalOcean-hosted open-weight Gemma.

I would prioritize local/private inference if you can get it working, because it makes the narrative much stronger.

6 — Backboard — $100

Potentially useful because the category supports assistant memory and RAG with an open-source project.

However, I would be careful.

You already have:

MongoDB memory + your own memory architecture.

Adding Backboard simply to collect another category could make the architecture incoherent.

If Backboard genuinely improves the memory/RAG layer, use it.

Otherwise skip it.

7 — Mastra — $100

This is another very natural fit.

The category explicitly allows orchestrating an agent over open models and adding memory/tools.

You could structure your agent as:

ThirdWheel Agent

Tools:
├── get_person_profile()
├── search_memories()
├── add_interaction()
├── update_memory()
├── reality_check()
└── generate_summary()

Mastra can orchestrate the agent/tool layer.

If you're comfortable with TypeScript, this is worth considering.

8 — GitHub Copilot — $100

This one is not really a product-runtime category.

It's about building with Copilot's coding agent/CLI/app, GitHub Actions, or PR review.

Since you're using Antigravity, I wouldn't switch your whole development workflow just for this.

You could potentially use Copilot's coding agent or CLI meaningfully, but don't distort your workflow merely to claim the category.

9 — Entire — $100

Potentially useful because the category is specifically about sharing/searching agent sessions to explain why code exists.

This could be good for your write-up if your development process generates useful agent sessions.

Again, don't force it.

10 — ElevenLabs — $100

This could actually make your demo fun.

You could add:

“Reality Check — voice mode.”

Friend:

“Okay I need to tell you what happened with Arjun—”

Third Wheel:

“Before you begin: are you asking me to analyze the evidence or validate your theory?”

😂

ElevenLabs is explicitly eligible for giving an open-source agent a voice, transcribing audio for a local model, or generating narration.

This could be a legitimate optional feature.

But voice should not be your core MVP.

11 — SerpApi — probably skip

SerpApi's category is about giving an agent live web search, grounding RAG in fresh results, or tracking news.

It doesn't naturally belong in Third Wheel.

You could build:

“What's happening this weekend?”

But that isn't your core problem.

Skip it.

12 — Temporal — interesting but probably overkill

Temporal is for making agents durable across failures/retries and resuming workflows.

Technically it could fit:

Screenshot uploaded
 ↓
OCR
 ↓
Extraction
 ↓
Memory update
 ↓
Embedding
 ↓
Notification

But for a weekend hackathon, this is probably architecture for architecture's sake.

I'd skip unless you have time.

13 — Tiger Data

Tiger Data supports embeddings, pgvector, hybrid search and MCP-based database interaction.

But if you're already using MongoDB Atlas Vector Search, don't introduce PostgreSQL just for another $100 category.

MongoDB is a much cleaner fit for your project.

14 — TabPFN

The category is for forecasting, prediction, classification or anomaly detection from tabular data.

You could theoretically analyze:

response times
initiation rates
interaction frequency
conversation length

But I strongly recommend not building a “probability he likes you = 78%” system.

That would undermine your entire “receipts, not vibes” philosophy.

So:

Skip TabPFN.

15 — Tinker

Tinker is for fine-tuning a model and showing improvement in performance, latency or cost over a baseline.

You could theoretically fine-tune an extraction/classification model.

But given your time constraint, I would not make this a core target unless you already know Tinker.

16 — Arduino

No.

😂

Unless you decide your friend needs a physical “DO NOT TEXT HIM” button, don't force hardware into this.

The Arduino category specifically requires building with an Arduino UNO Q.

My recommended prize stack

If I were you, I'd target:

Technology	Role	Category
Gemma	Core AI	$200 featured
MongoDB Atlas	Memory + Vector Search	$100
Sentry	Agent observability	$100
Render	Deployment/runtime	$200
Mastra	Agent orchestration	$100
ElevenLabs	Optional voice	$100
DigitalOcean	Optional model hosting	$200

But don't implement all seven blindly.

My ideal architecture would be:

Gemma + MongoDB Atlas + Sentry + Render

and then Mastra if it actually improves the agent orchestration.

That gives you four coherent technologies instead of a Frankenstein project.

Your final architecture

I would aim for:

                         THIRD WHEEL
                    "Receipts, not vibes."
                              │
                              ▼
                    ┌─────────────────┐
                    │   Next.js UI    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  API / Agent    │
                    │    Layer        │
                    └────────┬────────┘
                             │
                ┌────────────┼─────────────┐
                │            │             │
                ▼            ▼             ▼
             OCR /        Memory        Person
             parsing      Engine       Resolver
                │            │             │
                └────────────┼─────────────┘
                             ▼
                    ┌─────────────────┐
                    │ MongoDB Atlas   │
                    │                 │
                    │ Documents       │
                    │ Vector Search   │
                    │ Memory          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │      Gemma      │
                    │  Open-weight AI │
                    └────────┬────────┘
                             │
                ┌────────────┼─────────────┐
                ▼            ▼             ▼
             Reality       Memory        Action
              Check        Answer        Suggestion
                │            │             │
                └────────────┼─────────────┘
                             ▼
                       Sentry Traces

And deploy the application/backend appropriately on Render if you're using it for the category.

17. What tech stack I would actually use
Frontend

Next.js + TypeScript

Why?

fast to build
excellent UI ecosystem
easy API integration
easy deployment
TypeScript helps keep the project sane
excellent fit for an AI application

Use:

Next.js
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion only where useful

Don't spend six hours making animations.

Backend

I'd actually keep this in TypeScript rather than introducing Python unless you specifically need Python for model inference.

Something like:

Next.js
   ↓
API routes / server actions
   ↓
Agent service
   ↓
MongoDB
   ↓
Gemma

If you need a dedicated Python AI service:

Next.js
   ↓
Node/TypeScript API
   ↓
FastAPI
   ↓
Gemma

But for a weekend:

Avoid two backend languages unless necessary.

18. Database
MongoDB Atlas

Use:

document storage
vector search
person-specific memory
interaction history
event timeline

This is one of the most natural sponsor integrations in the entire project.

19. AI
Gemma

Your main open-weight model.

Use structured output whenever possible.

For example:

{
  "person_id": "arjun",
  "facts": [],
  "events": [],
  "open_threads": [],
  "assumptions": [],
  "uncertainties": []
}

Don't let the LLM directly write arbitrary database records.

Use:

LLM
 ↓
Validated schema
 ↓
Business logic
 ↓
Database

That's much safer.

20. OCR

For screenshots, use an OCR layer.

Your exact choice can depend on what you can get running fastest, but conceptually:

Screenshot
 ↓
OCR
 ↓
Text
 ↓
LLM

The LLM shouldn't have to magically interpret every raw image if you can reliably extract the text first.

21. Observability
Sentry

Instrument:

ingestion
OCR
extraction
retrieval
model call
memory update
response generation

Then your DEV article can show an actual trace.

That makes the project feel like something an engineer could evolve into a real product rather than a weekend demo.

22. Agent orchestration

If you use Mastra, make it meaningful.

Something like:

ThirdWheelAgent

Tools:

searchPersonMemory
getRecentInteractions
extractFacts
createMemory
updateMemory
getOpenThreads
runRealityCheck

Then:

User question
      ↓
Agent
      ↓
identify active person
      ↓
retrieve relevant evidence
      ↓
reason
      ↓
answer

Don't create six agents just because you can.

One good agent + well-designed tools is better.

23. What skills.sh skills should you use?

Since you're building in Antigravity, this is actually a great place to use skills rather than simply asking the coding agent to “build everything.”

Antigravity is explicitly an agentic development platform where agents can plan, execute and verify work across the editor, terminal and browser.

The skills ecosystem describes skills as reusable procedural capabilities that give coding agents specialized knowledge.

For this particular project, I'd prioritize these.

Skill 1 — Context Engineering

This is probably the #1 skill for your project.

There are current skills.sh implementations specifically around context engineering, including Addy Osmani's context-engineering. It focuses on giving an agent the right information at the right time and avoiding both insufficient context and context overload.

This maps directly to Third Wheel.

Your entire product is basically:

Which memories should the model see when answering this question about this particular person?

Use this skill when building:

retrieval
prompt architecture
person-scoped context
context windows
agent memory
hallucination reduction
Skill 2 — Memory Systems

This is arguably even more important.

The current memory-systems skill specifically covers persistent agent memory, layered memory architectures, entity consistency, retrieval, knowledge graphs and accumulated knowledge.

This maps almost perfectly to:

Person
 ↓
Interactions
 ↓
Facts
 ↓
Events
 ↓
Open threads
 ↓
Long-term memory

Use it when designing the MongoDB schema and memory lifecycle.

Skill 3 — AI Engineer

There's an AI-engineering skill on skills.sh specifically aimed at production-grade LLM applications, RAG, agents, vector search, AI safety, monitoring and cost controls.

This is useful for:

LLM architecture
RAG
embeddings
model integration
agent design
monitoring

I'd definitely use something in this category.

Skill 4 — Agent Development Workflow

The Google Agents CLI workflow skill is designed to work with coding agents including Antigravity CLI and emphasizes scaffolding, evaluation, CI/CD and re-reading relevant skills during different development phases.

This is useful for making Antigravity behave more like a senior engineer working through a project, rather than:

“Generate 4,000 lines of code.”

Skill 5 — Security / Privacy

I would explicitly install a security-focused skill as well.

This project handles:

screenshots
personal conversations
potentially names
relationship information
private messages

Ask Antigravity to perform:

privacy review
threat model
secret scanning
authentication review
data-retention review
prompt-injection review

Especially because you're letting an AI process user-provided text.

24. Your Antigravity workflow

This is important.

Do not tell Antigravity:

“Build Third Wheel.”

That's how you end up with a giant messy codebase.

Instead:

Phase 1

Design the architecture and data model. Do not write implementation code.

Phase 2

Build the person/profile system.

Phase 3

Build interaction ingestion.

Phase 4

Build structured memory extraction.

Phase 5

Build MongoDB retrieval.

Phase 6

Build Reality Check.

Phase 7

Add screenshot OCR.

Phase 8

Add observability.

Phase 9

Add sponsor integrations.

Phase 10

Test the complete user journey.

This is where the context-engineering skills become valuable.

25. Your MVP should be surprisingly small

Your first usable version should only have:

Screen 1

People

Arjun
Rahul
Sameer

+ Add person
Screen 2

Person

Arjun

Known facts
Recent interactions
Open threads
Memory

+ Add interaction
Screen 3

Add interaction

[ Upload screenshot ]

[ Paste conversation ]

[ Tell what happened ]
Screen 4

Analysis

FACTS

...

ASSUMPTIONS

...

UNKNOWN

...

OPEN THREADS

...
Screen 5

Ask Third Wheel

"What do we actually know
about this situation?"

That's your MVP.

26. The “magic moment” judges should see

Your demo shouldn't begin with your architecture.

It should begin with:

“This is my friend.”

Then:

“She has been talking to Arjun.”

Upload screenshot.

The system extracts:

Arjun suggested getting coffee.

Then switch to another person.

Upload another conversation.

Then ask:

“What did Arjun say about coffee?”

Correct answer.

Then ask:

“Does Arjun actually like her?”

The system says:

Insufficient evidence.

Then:

“Why?”

And it displays:

Evidence FOR
• initiated conversation
• suggested coffee

Evidence AGAINST
• none directly

Unknown
• romantic intent

That is your demo.

27. The technical reveal comes afterward

Then say:

“Everything you just saw is backed by a person-scoped memory system.”

Show:

ARJUN
 ├── interactions
 ├── facts
 ├── events
 ├── open threads
 └── embeddings

Then:

“I used Gemma as the open-weight reasoning layer, MongoDB Atlas as the memory/vector layer, and Sentry to trace the agent.”

That's when the judges realize:

Oh, this isn't just a chatbot.

28. Your actual hackathon story

I would tell the story in this order.

Opening:

I built an AI because I was tired of receiving screenshots.

Then:

My friend has been single for a while, and apparently every new conversation requires a committee meeting.

Then show screenshots.

Then:

But after a while I noticed something more interesting.

She wasn't really asking me to predict whether someone liked her.

She was trying to reconstruct a situation from incomplete information.

Then:

What did he actually say?

What happened last time?

Did he initiate?

Am I remembering this correctly?

Then:

So I built Third Wheel.

Then:

Receipts, not vibes.

Then the demo.

That's an extremely strong narrative structure.

29. The open-source AI argument

Your article should eventually contain something like:

Dating conversations are private. I didn't want the central feature of this application to require uploading someone's personal conversations to a closed AI service.

So I designed Third Wheel around open-weight AI and user-controlled memory.

Then explain:

User-controlled input
        ↓
Local/private processing
        ↓
Open-weight model
        ↓
Structured memory
        ↓
Evidence-backed retrieval

That directly addresses the challenge's requirement to explain why open innovation mattered, rather than simply checking a technology box.

30. The sponsor strategy I'd ultimately choose

If you're working under the current Weekend Challenge, my priority would be:

Tier A — absolutely

Gemma

Core AI.

MongoDB Atlas

Memory + vector search.

Sentry

Observability.

Tier B — very useful

Render

Deployment/AI runtime if you can make the integration meaningful.

Tier C — only if time permits

Mastra

Agent orchestration.

ElevenLabs

Voice mode.

Don't force

TabPFN
Tinker
Arduino
SerpApi
Temporal
Tiger Data
Backboard
Entire
GitHub Copilot
DigitalOcean

unless you discover a genuine architectural reason for them.

The challenge explicitly says you can qualify for as many categories as the project genuinely uses, so there is no reason to sabotage a coherent product merely to check more boxes.

And remember: you can only win once per challenge, so having five eligible categories doesn't mean you collect five prizes.

31. My final recommended stack

If I were building this in your position, I'd use:

FRONTEND
Next.js
TypeScript
Tailwind
shadcn/ui

BACKEND
Next.js API / TypeScript

DATABASE
MongoDB Atlas

VECTOR MEMORY
MongoDB Atlas Vector Search

AI
Gemma

AI ORCHESTRATION
Mastra (optional)

OCR
Tesseract / suitable OCR service

OBSERVABILITY
Sentry

DEPLOYMENT
Render

DEVELOPMENT
Google Antigravity

AGENT SKILLS
Context Engineering
Memory Systems
AI Engineering
Agent Development Workflow
Security / Privacy

And the architecture:

              ┌────────────────────┐
              │     NEXT.JS UI     │
              └─────────┬──────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  THIRD WHEEL AGENT │
              │     / Mastra       │
              └─────────┬──────────┘
                        │
          ┌─────────────┼──────────────┐
          │             │              │
          ▼             ▼              ▼
       PERSON        MEMORY         ANALYSIS
      RESOLVER       ENGINE         ENGINE
          │             │              │
          └─────────────┼──────────────┘
                        ▼
               ┌─────────────────┐
               │  MONGODB ATLAS  │
               │                 │
               │ Documents       │
               │ Vector Search   │
               │ Memory          │
               └────────┬────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │    GEMMA    │
                 │ Open-weight │
                 └─────────────┘
                        │
                        ▼
              ┌────────────────────┐
              │  REALITY CHECK     │
              │                    │
              │ FACT               │
              │ ASSUMPTION         │
              │ UNKNOWN            │
              │ EVIDENCE           │
              └────────────────────┘

                 + SENTRY
                 + RENDER
32. And one final thing: don't overbuild it

The temptation will be to add:

dating recommendations → compatibility → matchmaking → voice → web search → personality analysis → graphs → notifications → Tinder integration → relationship prediction...

Don't.

Your strongest product is actually quite narrow:

A private, person-separated memory system for navigating dating conversations, with an evidence-based “Reality Check.”

Everything else supports that.

The differentiating sentence is:

“Third Wheel doesn't tell you whether they like you. It tells you what you actually know.”

And the technical sentence is:

“Each person gets an isolated, source-grounded memory space, and an open-weight model reasons only over the evidence relevant to that person.”

That is the combination I would build around.

Also, the current challenge requires a new project built within the challenge window, not an old repository repurposed for submission, so make sure this repo and its substantive work genuinely start during the current challenge period. The submission deadline is October 5, 2026 at 6:59 AM UTC (12:29 PM IST), and winners are scheduled for the week of October 5.

In short: don't try to build the world's best dating AI. Build the world's funniest, most privacy-conscious, evidence-backed “friend who is tired of receiving screenshots” AI—and make the engineering underneath it surprisingly serious.