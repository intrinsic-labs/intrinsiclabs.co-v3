export type HomeProject = {
  id: string;
  status: "Live" | "In Progress";
  name: string;
  subtitle: string;
  stack: string[];
  summary: string;
  href?: string;
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
  },
  {
    id: "002",
    status: "Live",
    name: "Dog Body Mind",
    subtitle: "Multilingual Fitness Platform",
    stack: ["Next.js", "Internationalization", "Payment workflow"],
    summary:
      "Client platform focused on conversion and long-term maintainability across multiple locales and service offerings.",
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
    stack: ["Android", "Kotlin", "Elo touch kiosks",],
    summary:
      "Operational software for event check-in and on-site flow, designed for reliability in real-world physical environments.",
  },
];

export const aboutTeaser =
  "Self-taught engineer. I study the best systems and build to that standard, with architecture choices aimed at resilience instead of short-term demos.";
