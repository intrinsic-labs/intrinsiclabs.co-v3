export type HomeProject = {
  id: string;
  status: "Live" | "In Progress";
  name: string;
  subtitle: string;
  stack: string[];
  summary: string;
  href?: string;
  viewportScene?: "wireframe-tree" | "wireframe-dog-head" | "wireframe-church";
};

export const homeProjects: HomeProject[] = [
  {
    id: "001",
    status: "Live",
    name: "Aspen Grove",
    subtitle: "LLM Interface + Knowledge Tool",
    stack: ["React Native", "WatermelonDB", "Offline-first sync"],
    summary:
      "Exploration-first AI interface focused on preserving context, branchable reasoning, and practical model control.",
    viewportScene: "wireframe-tree",
  },
  {
    id: "002",
    status: "Live",
    name: "Dog Body Mind",
    subtitle: "Multilingual Fitness Platform",
    stack: ["Next.js", "Internationalization", "Payment workflow"],
    summary:
      "Client platform focused on conversion and long-term maintainability across multiple locales and service offerings.",
    viewportScene: "wireframe-dog-head",
  },
  {
    id: "003",
    status: "In Progress",
    name: "GFBR",
    subtitle: "Enterprise Sales Mobile App",
    stack: ["React Native", "Salesforce", "Okta SSO"],
    summary:
      "A mobile-first replacement concept for legacy enterprise sales process tooling with faster field usage patterns.",
  },
  {
    id: "004",
    status: "Live",
    name: "Church Ops",
    subtitle: "Check-In + Kiosk Stack",
    stack: ["Android", "Kotlin", "Elo touch kiosks"],
    summary:
      "Operational software for event check-in and on-site flow, designed for reliability in real-world physical environments.",
    viewportScene: "wireframe-church",
  },
];

export const aboutTeaser =
  'I\'m a self taught software engineer. I firmly believe you can learn anything you want if you just sit down and work at it. I got tired of wishing apps would "just do this one thing", so I learned to code (pre-ChatGPT). I study the top players in a space, learn why they do things the way they do, then go and build cool stuff that can hold its own.';
