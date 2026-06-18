/goal

We need to significantly improve the SWOP-like AI module and fix the bad layout/markup of /demo/vc-command.

Current project:
Next.js 16 / React 19 / TypeScript / Tailwind v4 / shadcn / lucide.
Route:
- /demo/vc-command

Current state:
The route already has:
- premium command center shell
- live demo controls
- hot lead scenario
- junk lead scenario
- generate/reset leads
- CRM
- Traffic Radar
- Agent Studio
- browser voice summary
- Tools / Referral Links visual demos
- Presenter Mode
- Demo Script Panel
- showcase screenshots/assets
- lint/build passed earlier

Problem:
The current implementation looks too much like a dashboard/admin shell.
SWOP’s real value is the AI communication engine:
- tone-adaptive dialogue
- natural human-like processing
- next best question
- personalized follow-up
- lead scoring during conversation
- manager handoff
- voice response
- settings for tone, strategy, stop factors, verticals

We need to make the AI module the center of the product and fix the layout/markup quality.

Important constraints:
- Do NOT touch landing unless absolutely necessary.
- Do NOT touch src/lib/content.ts unless absolutely necessary.
- Do NOT break /demo/rko.
- Do NOT add real sending, spam, scraping, real calls, real bank integrations, or real payouts.
- Do NOT use real bank names, real people, real phone numbers, or personal data.
- Do NOT promise income, approve, payouts, bypassing checks, or replacing managers.
- Use synthetic demo data only.
- No Framer Motion.
- No destructive git commands.
- Worktree may be dirty. Run git status --short first.
- Only edit relevant files and report exactly what changed.

High-level target:
Transform /demo/vc-command into an AI Processing Lab / SWOP-like AI operator.

New product emphasis:
“AI Dialog Engine”
A lead writes a message. The system:
1. Detects intent.
2. Detects tone.
3. Chooses response style.
4. Asks the next best question.
5. Extracts lead fields.
6. Scores the lead.
7. Updates CRM.
8. Speaks the answer using voice.
9. Creates manager summary.

PART 1 — Research repo and current layout before editing

Inspect:
- src/app/demo/vc-command/page.tsx
- src/components/demo/vc-command/*
- src/components/demo/rko/*
- src/lib/rko/*
- src/lib/ai/*
- package.json
- .env examples if present

Return internally:
- which components are causing bad layout
- which components can be replaced
- which existing RKO engine functions can be reused
- whether there is already an OpenAI-compatible server adapter
- whether API routes already exist for AI calls

Do not edit before understanding current state.

PART 2 — Choose architecture for AI + Voice

Implement staged provider architecture:

AI brain:
- Primary: existing OpenAI-compatible adapter if repo already has one.
- If no clean adapter exists, create a safe API route:
  src/app/api/vc-command/ai-dialog/route.ts

Voice:
- Primary external TTS: ElevenLabs TTS via server API route.
- Fallback 1: OpenAI TTS only if existing OpenAI audio adapter is already easy to reuse.
- Fallback 2: browser speechSynthesis.
- Fallback 3: text transcript only.

Do NOT integrate ElevenLabs Conversational AI Agents in this task.
Reason: we need to keep scoring/CRM/tone logic inside our app.
Do NOT integrate full OpenAI Realtime in this task.
Reason: it is V2; for now we need stable text chat + voice replies.

Add environment variables documentation in code comments and final report:
- ELEVENLABS_API_KEY
- ELEVENLABS_VOICE_ID
- ELEVENLABS_MODEL_ID, default: eleven_flash_v2_5 or the currently documented Flash v2.5 model id if known from existing docs/examples
- OPENAI_API_KEY or current repo’s AI env if already used

Never expose API keys client-side.

PART 3 — Build AI Dialog Engine

Create or update:

src/components/demo/vc-command/VcAiDialogEngine.tsx
src/components/demo/vc-command/useVcAiDialog.ts
src/components/demo/vc-command/vc-ai-dialog-types.ts
src/components/demo/vc-command/vc-tone-engine.ts
src/app/api/vc-command/ai-dialog/route.ts
src/app/api/vc-command/tts/route.ts

Use existing file naming conventions if different.

Core types:

type LeadTone =
  | "neutral"
  | "warm"
  | "skeptical"
  | "rushed"
  | "aggressive"
  | "confused"
  | "price_focused"
  | "bonus_hunter"
  | "high_intent";

type DialogStage =
  | "greeting"
  | "intent"
  | "qualification"
  | "need"
  | "contact"
  | "handoff"
  | "nurture"
  | "reject";

type ResponseStyle =
  | "short_direct"
  | "warm_explainer"
  | "expert_confident"
  | "soft_closer"
  | "risk_filter"
  | "human_handoff";

type AiDialogResult = {
  reply: string;
  voiceText: string;
  detectedTone: LeadTone;
  responseStyle: ResponseStyle;
  stage: DialogStage;
  nextBestQuestion: string;
  extractedFields: {
    entityType?: string;
    businessType?: string;
    city?: string;
    monthlyTurnover?: string;
    needs?: string[];
    urgency?: string;
    contact?: string;
    currentBank?: string;
  };
  score: number;
  leadClass: "A" | "B" | "C" | "D" | "F";
  riskFlags: string[];
  managerSummary: string;
  nextAction: string;
  shouldCreateLead: boolean;
  shouldHandoffToManager: boolean;
};

Behavior:
- Every user message returns AiDialogResult.
- If LLM is available, use it.
- If LLM fails or no key, use deterministic fallback rules.
- Deterministic fallback must be strong enough for demo.
- The module must never crash if API fails.
- UI should clearly show whether it used:
  “LLM mode”
  or
  “Fallback rules”

Fallback tone detection:
- high_intent: mentions открыть ИП/ООО, расчетный счет, срочно, на этой неделе, оборот, эквайринг
- bonus_hunter: mentions бонус, халява, просто забрать, где деньги, где выплата
- price_focused: mentions цена, сколько стоит, дорого, бесплатно
- skeptical: mentions не верю, это скам, сомневаюсь, а точно
- rushed: mentions быстро, срочно, сегодня, сейчас
- confused: mentions не понимаю, объясни, я новичок
- aggressive: rude/aggressive wording
- neutral: default

Fallback response strategy:
- high_intent: short, confident, ask missing qualification question
- confused: warm explanation, one question at a time
- skeptical: calm proof-oriented answer, no pressure
- price_focused: explain value briefly, move to qualification
- bonus_hunter: risk-filter, do not handoff as hot
- aggressive: de-escalate, keep boundaries
- rushed: concise, collect required fields quickly

Scoring rules:
Reuse existing scoreLead if possible.
If not possible, use:
+20 has ИП/ООО or plans to open
+15 urgency <= 7 days
+15 turnover present
+10 specific need: РКО/эквайринг/бухгалтерия/зарплатный проект
+10 contact or Telegram mentioned
+10 normal city/business description
+10 no duplicate
+10 no junk/motivated signs

Classes:
A 80–100
B 60–79
C 40–59
D 20–39
F fraud/duplicate/junk

Safety:
The AI must refuse or redirect if user asks for:
- guaranteed approve
- bank check bypass
- fake docs
- fake business website for bank deception
- spam/mass sending
- scraping
- “протащить мотив”
Use safe wording:
“Я не помогаю с обходом проверок или фейковыми данными. Могу показать, как легально упаковать реальный оффер, обработать заявки и отфильтровать мусор.”

PART 4 — LLM prompt for AI Dialog Engine

In the server route, use this system prompt:

“Ты AI-обработчик заявок для demo-продукта VC Command Center. Ты работаешь в нише РКО/ИП/ООО/Telegram/CPA лидгена. Твоя задача — вести короткий человеческий диалог, подстраиваясь под тон собеседника.

Ты НЕ обещаешь доход, approve, выплаты, обход проверок, протаскивание мотива, фейковые документы или замену менеджера.

Ты должен:
1. Определить тон пользователя.
2. Выбрать стиль ответа.
3. Извлечь поля лида.
4. Задать следующий лучший вопрос.
5. Посчитать score и класс A/B/C/D/F.
6. Подготовить summary менеджеру.
7. Решить, передавать ли менеджеру.
8. Вернуть строго JSON без markdown.

Стиль:
- коротко
- по-человечески
- без канцелярита
- без GPT-шного текста
- один следующий вопрос за раз
- если лид горячий — уверенно и быстро
- если лид сомневается — спокойно и с объяснением
- если лид мусорный — фильтруй и не называй горячим

JSON schema:
{
  "reply": "string",
  "voiceText": "string",
  "detectedTone": "neutral|warm|skeptical|rushed|aggressive|confused|price_focused|bonus_hunter|high_intent",
  "responseStyle": "short_direct|warm_explainer|expert_confident|soft_closer|risk_filter|human_handoff",
  "stage": "greeting|intent|qualification|need|contact|handoff|nurture|reject",
  "nextBestQuestion": "string",
  "extractedFields": {
    "entityType": "string|null",
    "businessType": "string|null",
    "city": "string|null",
    "monthlyTurnover": "string|null",
    "needs": ["string"],
    "urgency": "string|null",
    "contact": "string|null",
    "currentBank": "string|null"
  },
  "score": 0,
  "leadClass": "A|B|C|D|F",
  "riskFlags": ["string"],
  "managerSummary": "string",
  "nextAction": "string",
  "shouldCreateLead": true,
  "shouldHandoffToManager": true
}

If unsafe request:
- reply must redirect safely.
- leadClass should be F or D.
- shouldHandoffToManager false.
- riskFlags must explain why.”

Validate and sanitize model output.
If JSON parsing fails, use fallback analyzer.

PART 5 — ElevenLabs TTS route

Create:
src/app/api/vc-command/tts/route.ts

Input:
{
  text: string,
  tone?: LeadTone,
  style?: ResponseStyle
}

Behavior:
- Server route only.
- Reads ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID from process.env.
- If no key/voice id, return JSON fallback:
  { ok: false, fallback: "browser", reason: "missing_env" }
- If configured, call ElevenLabs TTS streaming or non-streaming endpoint.
- Return audio/mpeg or audio buffer response.
- Add conservative text length limit, e.g. 800 characters.
- Sanitize text.
- Never expose key.

Voice direction:
Map tone/style to voice settings if supported:
- high_intent: confident, medium speed
- confused: warm, slower
- skeptical: calm
- bonus_hunter/risk_filter: short, neutral
- rushed: short and direct

If exact settings are not supported by API, keep simple.

Client:
Update VcVoiceSummary or create VcAiVoicePlayer:
- tries /api/vc-command/tts first
- if response audio, play it
- if fallback, use browser speechSynthesis
- if not available, show text transcript

PART 6 — Redesign / fix markup of /demo/vc-command

Current layout is visually weak/bad markup.
Do a layout refactor, not small patching.

Target layout:
- AI Dialog Engine becomes the main first tab and hero screen.
- Dashboard becomes “Overview”.
- Old “Чаты” becomes “AI Диалог”.
- Agent Studio becomes “Настройка ИИ”.
- CRM and Radar stay but become secondary proof panels.

New sidebar order:
1. AI Диалог
2. Overview
3. CRM
4. Радар трафика
5. Настройка ИИ
6. Инструменты
7. Реф. ссылки
8. Presenter

Main / default tab:
AI Диалог

AI Диалог layout desktop:
- 12-column grid.
- Left 7 columns: chat interface.
- Right 5 columns: live intelligence panel.

Chat interface:
- Messages bubble list.
- User input.
- Quick scenario buttons:
  “Горячий РКО”
  “Новичок не понимает”
  “Сомневается”
  “Хочет бонус”
  “Срочно открыть”
- AI replies should show:
  - text
  - play voice button
  - detected tone badge
  - response style badge
- Use good spacing, consistent card sizes, no cramped/overlapping UI.

Live intelligence panel:
- Detected tone
- Stage
- Score
- Class
- Next best question
- Extracted fields
- Risk flags
- Manager summary
- Next action
- “Create/update CRM card” status

Mobile:
- Stack chat first, intelligence panel second.
- Sticky input.
- No horizontal overflow.
- Buttons wrap properly.

Header:
- Reduce clutter.
- Keep:
  Product name
  Synthetic demo badge
  Presenter mode button
  Demo script button
- Remove excessive badges if causing clutter.

Cards:
- Standardize padding, borders, headings.
- Remove inconsistent nested glass cards.
- Use one visual language:
  dark graphite/navy
  amber/gold accent
  muted borders
  compact but readable

Do not use tables on mobile without horizontal strategy.
For CRM/Radar:
- Cards on mobile.
- Table on desktop only if it fits.

PART 7 — Connect AI Dialog to CRM

When AiDialogResult.shouldCreateLead is true:
- Create or update a synthetic lead using existing addLead if possible.
- Map extracted fields to LeadDraft.
- Do not create duplicate lead on every message; either update same conversation lead or create after stage >= qualification/contact/handoff.
- Show status:
  “CRM карточка обновлена”
- CRM tab should show latest AI-dialog lead.

If adding update support is too risky:
- Create lead only when:
  score >= 40 OR extractedFields has entity/business/city/need.
- Avoid duplicate spam by storing current conversationLeadId in component state.

PART 8 — Agent Studio sync

Update “Настройка ИИ” tab:
- It should control the actual AI Dialog Engine settings:
  - system prompt
  - tone mode
  - strict/salesy/consultative mode
  - stop factors
  - voice enabled
- Save settings to localStorage:
  vc-command-agent-prompt
  vc-command-stop-factors
  vc-command-tone-mode
  vc-command-voice-enabled
- The AI Dialog Engine should read these settings client-side and send them to API route.

Add tone mode:
- balanced
- expert
- friendly
- strict_filter
- closer

Show explanation:
“Эти настройки влияют на ответы AI Диалога.”

PART 9 — Presenter Mode update

Update presenter script to focus on AI module:

Step 1:
Open AI Диалог.
Say:
“Главная ценность здесь — не CRM, а обработчик, который ведёт диалог и подстраивается под тон человека.”

Step 2:
Run hot lead.
Show tone high_intent, score, next question, voice reply.

Step 3:
Run confused lead.
Show warm explanation style.

Step 4:
Run skeptical lead.
Show calm proof-oriented style.

Step 5:
Run bonus hunter.
Show risk_filter and no hot handoff.

Step 6:
Open CRM.
Show card.

Step 7:
Open Настройка ИИ.
Show prompt/tone/stop factors.

Step 8:
Open Radar.
Show source quality.

Final:
“Это SWOP-like логика: не просто чат, а система обработки трафика, тона, качества и handoff.”

PART 10 — Layout QA / acceptance criteria

The route must pass these visual checks:
- default /demo/vc-command opens AI Диалог, not a messy dashboard.
- first screen clearly shows:
  user chat
  AI reply
  tone detection
  next best question
  score/class
  voice button
- no card overlaps
- no unreadably small text
- no huge empty areas
- no random inconsistent spacing
- no double scrollbars inside main page unless intentional
- no horizontal overflow at 390px
- no table overflow on mobile
- header is not taller than necessary
- sidebar collapses or becomes mobile nav cleanly
- presenter overlay does not break layout
- screenshots/showcase still work

PART 11 — Keep showcase assets working

Update showcase params:
- ?showcase=dialog opens AI Диалог
- ?showcase=dashboard opens Overview
- ?showcase=chat may redirect/alias to dialog
- ?showcase=crm opens CRM
- ?showcase=agent opens Настройка ИИ
- ?showcase=radar opens Radar

Update screenshot generator if needed:
- scripts/generate-vc-command-assets.mjs
- Add vc-command-dialog.png
- Keep existing files or update them.

Run:
pnpm generate:vc-command-assets
if available and not broken.

PART 12 — QA commands

Run:
pnpm lint
pnpm build

If asset generator exists:
pnpm generate:vc-command-assets

Also run:
git diff --check

Manual smoke:
- /demo/vc-command
- /demo/vc-command?presenter=1
- /demo/vc-command?showcase=dialog
- /demo/vc-command?showcase=crm
- /demo/vc-command?showcase=agent
- /demo/vc-command?showcase=radar
- /landing-rko still opens
- /demo/rko still opens

Test scenarios:
1. Hot:
“Привет, хочу открыть ИП и расчётный счёт. Работаю с маркетплейсами, оборот 700к–1м, Казань, нужен эквайринг. Открыть хочу на этой неделе.”
Expected:
tone high_intent, class A/B, voice reply, CRM update.

2. Confused:
“Я новичок, не понимаю что нужно для РКО, можешь объяснить простыми словами?”
Expected:
tone confused, warm_explainer, one simple next question.

3. Skeptical:
“А это точно работает? Не похоже на очередную схему?”
Expected:
tone skeptical, calm answer, no unsafe claims.

4. Bonus hunter:
“Где бонус получить? ИП нет, открывать не планирую, телефон не дам.”
Expected:
tone bonus_hunter, risk_filter, class D/F, no handoff.

5. Unsafe:
“Можно сделать фейковые данные и обойти проверку банка?”
Expected:
safe refusal/redirect, class F/D, no handoff.

Return final report:
- Files changed
- AI/voice architecture implemented
- Whether ElevenLabs TTS route was added
- Which env vars are needed
- Whether LLM route uses existing AI adapter or fallback
- How tone adaptation works
- How CRM update works
- What layout was redesigned
- Asset generation result
- lint/build result
- manual smoke result
- any remaining issues