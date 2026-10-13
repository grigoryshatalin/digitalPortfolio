/* ================================================================
   Single source of truth for every world. Edit content here once;
   all ten experiences (and nothing else) read from window.PORTFOLIO.
================================================================ */
(function () {
  const ROOT = new URL("..", document.currentScript.src).href;

  window.PORTFOLIO = {
    name: "Grigory Shatalin",
    first: "Grigory",
    last: "Shatalin",
    initials: "GS",
    role: "Software Engineer",
    intro:
      "Software engineer currently interning at AWS on the Boost Spaces team. " +
      "Previously at Circle, and studying CS at CU Boulder.",
    location: "Bellevue, WA",

    links: {
      email: "grshatalin@outlook.com",
      resume: ROOT + "Software_Engineer_Resume.pdf",
      linkedin: "https://www.linkedin.com/in/grigory-shatalin/",
      github: "https://github.com/grigoryshatalin",
      twitter: "https://x.com/g_shatalin",
    },

    // Ordered list used by worlds that render a generic "contact" block.
    contacts: [
      { id: "email",    label: "Email",    handle: "grshatalin@outlook.com",       href: "mailto:grshatalin@outlook.com" },
      { id: "linkedin", label: "LinkedIn", handle: "in/grigory-shatalin",          href: "https://www.linkedin.com/in/grigory-shatalin/" },
      { id: "github",   label: "GitHub",   handle: "github.com/grigoryshatalin",   href: "https://github.com/grigoryshatalin" },
      { id: "twitter",  label: "Twitter",  handle: "@g_shatalin",                  href: "https://x.com/g_shatalin" },
      { id: "resume",   label: "Resume",   handle: "Software_Engineer_Resume.pdf", href: ROOT + "Software_Engineer_Resume.pdf" },
    ],

    experience: [
      {
        id: "aws",
        role: "Software Engineering Intern",
        org: "Amazon Web Services",
        orgShort: "AWS",
        team: "Boost Spaces",
        location: "Bellevue, WA",
        dates: "Sep 2026 — Present",
        start: 2026.7, end: 2026.8,
        current: true,
        summary: "An event-driven approval system on EventBridge, SQS, Lambda and DynamoDB.",
        bullets: [
          "Building a cost-efficient event-driven approval system for the Spaces team, notifying content owners through Amazon's internal ticketing platform when newly ingested data requires review.",
          "Designing the DynamoDB data model and asynchronous workflow around idempotency, retries, durable state transitions, and failure recovery using EventBridge, SQS, and Lambda, while minimizing infrastructure complexity and operational cost.",
        ],
        tags: ["EventBridge", "SQS", "Lambda", "DynamoDB"],
        flow: ["Ingest", "EventBridge", "SQS", "Lambda", "DynamoDB", "Ticket"],
      },
      {
        id: "circle",
        role: "Software Engineering Intern",
        org: "Circle",
        orgShort: "Circle",
        team: "",
        location: "Remote",
        dates: "May — Aug 2026",
        start: 2026.35, end: 2026.66,
        current: false,
        summary: "Shipped @circle-fin/cpn, a typed TypeScript SDK for cross-border settlement.",
        bullets: [
          "Built and shipped @circle-fin/cpn, a typed TypeScript SDK for cross-border settlement on the Circle Payments Network, turning integration errors into compile-time guarantees.",
          "Designed structured error handling with exponential-backoff retries against CPN's REST APIs, making cross-border settlement flows fault-tolerant and resilient by default.",
          "Abstracted travel-rule compliance, Permit2 approvals, and JWE encryption behind typed helpers; authored an MCP server surfacing integration constraints and Solana signing requirements at development time.",
        ],
        tags: ["TypeScript", "REST", "MCP", "Solana"],
        flow: ["App", "@circle-fin/cpn", "Retry", "CPN API"],
      },
      {
        id: "isat",
        role: "Undergraduate Research Intern",
        org: "NSF AI Institute for Student-AI Teaming",
        orgShort: "NSF iSAT",
        team: "",
        location: "Boulder, CO",
        dates: "2025 — 2026",
        start: 2025.0, end: 2026.35,
        current: false,
        summary: "Classroom AI partners built on RAG and multimodal embeddings.",
        bullets: [
          "Building classroom AI partners in Python and TypeScript — response pipelines wired up with RAG and multimodal embeddings.",
          "Wrangling the multimodal stack: speech, gaze, text, and video flowing through annotation, evaluation, and live learning experiments.",
        ],
        tags: ["Python", "TypeScript", "RAG", "Multimodal"],
        flow: ["Speech · Gaze · Text · Video", "Embeddings", "RAG", "AI partner"],
      },
      {
        id: "akvelon",
        role: "Software Engineering Intern",
        org: "Akvelon",
        orgShort: "Akvelon",
        team: "",
        location: "Bellevue, WA",
        dates: "Jun — Aug 2023",
        start: 2023.42, end: 2023.66,
        current: false,
        summary: "Hardened Microsoft Power BI visuals and built IoT air-quality sensors.",
        bullets: [
          "Hardened four Microsoft Power BI visuals in TypeScript — modernized data handling, security fixes shipped upstream.",
          "Designed IoT sensors that pushed a million+ environmental readings into Azure SQL for Bellevue's air-quality program.",
        ],
        tags: ["TypeScript", "Power BI", "Azure SQL", "IoT"],
        flow: ["Sensors", "Azure SQL", "Power BI"],
        link: { label: "heatmap PR #119", href: "https://github.com/microsoft/powerbi-visuals-heatmap/pull/119" },
      },
    ],

    education: [
      {
        id: "cu",
        degree: "B.S. Computer Science",
        school: "University of Colorado Boulder",
        schoolShort: "CU Boulder",
        location: "Boulder, CO",
        dates: "Expected May 2027",
        gpa: "3.8",
      },
      {
        id: "lwtech",
        degree: "A.S. Computer Science (DTA/MRP)",
        school: "Lake Washington Institute of Technology",
        schoolShort: "LWTech",
        location: "Kirkland, WA",
        dates: "July 2024",
        gpa: "4.0",
      },
    ],

    projects: [
      {
        id: "endurance",
        name: "Endurance",
        status: "Building now",
        tagline: "A 36-week triathlon plan, on real calendar dates.",
        desc: "Native SwiftUI iPhone app that maps a 36-week full-distance triathlon plan onto real calendar dates — fully offline, on-device, with a Foundation-only core under 60+ tests.",
        tags: ["SwiftUI", "iOS", "Offline-first", "60+ tests"],
        flow: ["36-week plan", "Calendar dates", "iPhone"],
        url: "https://github.com/grigoryshatalin/ironmanapp",
      },
      {
        id: "modeltraining",
        name: "modeltraining",
        status: "Building now",
        tagline: "An LLM trading bot with a deterministic risk layer — live money.",
        desc: "AI-driven trading bot on Alpaca — an LLM proposes buy / sell / hold per symbol, then a deterministic risk layer sizes and gates every order. Trades live with real money — not paper trading or a dry-run.",
        tags: ["LLM", "Alpaca", "Risk engine", "Live trading"],
        flow: ["LLM", "Risk layer", "Alpaca order"],
        url: "https://github.com/grigoryshatalin/modeltraining",
      },
      {
        id: "buffai",
        name: "BuffAI",
        status: "Featured",
        tagline: "An AI course planner for CU Boulder.",
        desc: "Acting team lead and ML developer — AI-powered course planner for CU Boulder built on Ollama, with a Node.js / SQL stack tracking degree progress in real time.",
        tags: ["Ollama", "Node.js", "SQL", "Team lead"],
        flow: ["Ollama", "Node.js", "SQL"],
        url: "https://github.com/grigoryshatalin/BuffAI",
      },
      {
        id: "solana",
        name: "Circle × Solana Payments",
        status: "MBC 2025 finalist",
        tagline: "USDC to a just-in-time virtual card at checkout.",
        desc: "MBC 2025 finalist — top 5 of 200+ submissions. Non-custodial USDC-to-fiat: a Chrome extension mints a just-in-time virtual Mastercard from an on-chain transfer at checkout.",
        tags: ["Solana", "USDC", "Chrome extension", "Top 5 / 200+"],
        flow: ["USDC transfer", "Extension", "Virtual card"],
        url: "https://github.com/grigoryshatalin",
      },
    ],

    skills: [
      { id: "languages", group: "Languages", items: ["Python", "TypeScript", "JavaScript", "C", "SQL", "Bash"] },
      { id: "runtimes",  group: "Runtimes",  items: ["Node.js", "Chrome Extensions (MV3)", "Linux (RHEL/Ubuntu)"] },
      { id: "systems",   group: "Systems",   items: ["AWS", "Docker", "Git", "Solana (SPL Tokens, RPC)"] },
      { id: "ml",        group: "ML",        items: ["RAG", "Multimodal pipelines", "Backend APIs"] },
    ],

    principles: [
      "Reliability before novelty.",
      "Clarity before cleverness.",
      "Ship — and own what you ship.",
    ],
  };
})();
