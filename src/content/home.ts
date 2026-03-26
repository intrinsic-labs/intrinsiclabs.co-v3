export type HomeProject = {
  id: string;
  status: "Live" | "In Progress";
  name: string;
  subtitle: string;
  stack: string[];
  summary: string;
  caseStudySlug?: string;
  viewportScene?:
    | "wireframe-tree"
    | "wireframe-dog-head"
    | "wireframe-church"
    | "wireframe-wifi";
};

export const homeProjects = [
  {
    id: "001",
    status: "In Progress",
    name: "Aspen Grove",
    subtitle: "LLM Interface + Knowledge Tool",
    stack: ["React Native", "WatermelonDB", "Offline-first sync"],
    summary:
      "An LLM interface that treats conversations as explorable trees, not linear chats",
    caseStudySlug: "aspen-grove",
    viewportScene: "wireframe-tree",
  },
  {
    id: "002",
    status: "Live",
    name: "Dog Body Mind",
    subtitle: "Multilingual Fitness Platform",
    stack: ["React Native", "Internationalization", "Next.js"],
    summary:
      "A multi-language fitness platform for dog owners - web, mobile, and admin dashboard - serving content in 6 languages",
    caseStudySlug: "dog-body-mind",
    viewportScene: "wireframe-dog-head",
  },
  {
    id: "003",
    status: "In Progress",
    name: "GFBR (prototype)",
    subtitle: "Enterprise Sales Mobile App",
    stack: ["React Native", "Salesforce", "Expo SQLite"],
    summary:
      "A mobile app prototype to replace Salesforce Mobile for GFiber's door-to-door sales team",
    caseStudySlug: "gfbr",
    viewportScene: "wireframe-wifi",
  },
  {
    id: "004",
    status: "Live",
    name: "Church Ops",
    subtitle: "Check-In + Kiosk Stack",
    stack: ["iOS", "Android", "Elo touch kiosks", "PostgreSQL"],
    summary:
      "Custom-built operations tools for a 2,000-member church, from hardware kiosks to attendance tracking.",
    caseStudySlug: "church-ops",
    viewportScene: "wireframe-church",
  },
] as const satisfies readonly HomeProject[];

export const aboutTeaser =
  'I\'m a self taught software engineer. I firmly believe you can learn anything if you just sit down and work at it. I got tired of wishing apps would "just do this one thing", so I learned to code (pre-ChatGPT). I study the top players in a space, learn why they do things the way they do, then go and build cool stuff that can hold its own.';
