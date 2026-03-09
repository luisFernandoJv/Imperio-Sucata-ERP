export const designTokens = {
  colors: {
    // Primary - Azul profissional
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6", // Base
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
    // Success - Verde
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e", // Base
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    // Warning - Laranja
    warning: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316", // Base
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    // Danger - Vermelho
    danger: {
      50: "#fef2f2",
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444", // Base
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    // Info - Ciano
    info: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4", // Base
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
    },
    // Neutrals - Cinzas
    neutral: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
    "4xl": "6rem", // 96px
  },

  borderRadius: {
    none: "0",
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  },

  typography: {
    fontFamily: {
      sans: [
        "Inter",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      mono: ["Fira Code", "Consolas", "Monaco", "Courier New", "monospace"],
    },
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
      sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
      base: ["1rem", { lineHeight: "1.5rem" }], // 16px
      lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
      xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
      "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
      "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
      "4xl": ["2.25rem", { lineHeight: "2.5rem" }], // 36px
      "5xl": ["3rem", { lineHeight: "1" }], // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  transitions: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "300ms cubic-bezier(0.4, 0, 1, 1)",
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// Material types configuration
export const materialTypes = [
  // Metais Ferrosos
  {
    key: "ferro",
    name: "Ferro",
    category: "ferrosos",
    color: "gray",
    icon: "⚙️",
    minStock: 100,
    density: "high",
  },
  {
    key: "chapa",
    name: "Chapa",
    category: "ferrosos",
    color: "gray",
    icon: "🔲",
    minStock: 50,
    density: "high",
  },
  {
    key: "perfil pintado",
    name: "Perfil pintado",
    category: "ferrosos",
    color: "gray",
    icon: "📐",
    minStock: 30,
    density: "medium",
  },
  {
    key: "perfil natural",
    name: "Perfil natural",
    category: "ferrosos",
    color: "gray",
    icon: "🪝",
    minStock: 30,
    density: "medium",
  },
  {
    key: "bloco",
    name: "Bloco",
    category: "ferrosos",
    color: "gray",
    icon: "🧱",
    minStock: 20,
    density: "high",
  },
  {
    key: "bloco2",
    name: "Bloco 2°",
    category: "ferrosos",
    color: "gray",
    icon: "🔳",
    minStock: 15,
    density: "medium",
  },
  {
    key: "rad_chapa",
    name: "Rad. Chapa",
    category: "ferrosos",
    color: "gray",
    icon: "🔧",
    minStock: 25,
    density: "medium",
  },

  // Metais Não-Ferrosos
  {
    key: "aluminio",
    name: "Alumínio",
    category: "nao-ferrosos",
    color: "blue",
    icon: "🔧",
    minStock: 80,
    density: "high",
  },
  {
    key: "cobre",
    name: "Cobre",
    category: "nao-ferrosos",
    color: "orange",
    icon: "🔶",
    minStock: 50,
    density: "high",
  },
  {
    key: "bronze",
    name: "Bronze",
    category: "nao-ferrosos",
    color: "orange",
    icon: "🔶",
    minStock: 55,
    density: "medium",
  },
  {
    key: "cobre_mel",
    name: "Cobre Mel",
    category: "nao-ferrosos",
    color: "amber",
    icon: "🍯",
    minStock: 40,
    density: "medium",
  },
  {
    key: "magnesio",
    name: "Magnésio",
    category: "nao-ferrosos",
    color: "slate",
    icon: "⚗️",
    minStock: 35,
    density: "low",
  },
  {
    key: "rad_cobre",
    name: "Rad. Cobre",
    category: "nao-ferrosos",
    color: "orange",
    icon: "🔥",
    minStock: 30,
    density: "medium",
  },
  {
    key: "rad_metal",
    name: "Rad. Metal",
    category: "nao-ferrosos",
    color: "orange",
    icon: "⚡",
    minStock: 35,
    density: "medium",
  },
  {
    key: "latinha",
    name: "Latinha",
    category: "nao-ferrosos",
    color: "green",
    icon: "🥤",
    minStock: 200,
    density: "low",
  },
  {
    key: "inox",
    name: "Inox",
    category: "nao-ferrosos",
    color: "silver",
    icon: "✨",
    minStock: 30,
    density: "high",
  },
  {
    key: "antimonio",
    name: "Antimônio",
    category: "nao-ferrosos",
    color: "purple",
    icon: "💎",
    minStock: 10,
    density: "high",
  },

  // Cabos e Fios
  {
    key: "cabo_ai",
    name: "Cabo AI",
    category: "cabos",
    color: "yellow",
    icon: "🔌",
    minStock: 40,
    density: "medium",
  },
  {
    key: "tela",
    name: "Tela",
    category: "cabos",
    color: "yellow",
    icon: "🕸️",
    minStock: 50,
    density: "low",
  },

  // Tubos e Estruturas
  {
    key: "tubo_limpo",
    name: "Tubo Limpo",
    category: "tubos",
    color: "cyan",
    icon: "🚰",
    minStock: 20,
    density: "medium",
  },

  // Outros Materiais
  {
    key: "panela",
    name: "Panela",
    category: "outros",
    color: "yellow",
    icon: "🍳",
    minStock: 25,
    density: "medium",
  },
  {
    key: "metal",
    name: "Metal",
    category: "outros",
    color: "purple",
    icon: "🔩",
    minStock: 60,
    density: "high",
  },
  {
    key: "bateria",
    name: "Bateria",
    category: "eletronicos",
    color: "red",
    icon: "🔋",
    minStock: 40,
    density: "high",
  },
  {
    key: "motor_gel",
    name: "Motor Gel",
    category: "eletronicos",
    color: "indigo",
    icon: "⚡",
    minStock: 10,
    density: "high",
  },
  {
    key: "roda",
    name: "Roda",
    category: "automotivo",
    color: "black",
    icon: "🛞",
    minStock: 15,
    density: "high",
  },
  {
    key: "papelao",
    name: "Papelão",
    category: "papel",
    color: "brown",
    icon: "📦",
    minStock: 100,
    density: "low",
  },
  {
    key: "papel_branco",
    name: "Papel branco",
    category: "papel",
    color: "white",
    icon: "📄",
    minStock: 80,
    density: "low",
  },
];

export const categories = [
  { key: "todos", name: "Todos os Materiais", icon: "📋" },
  { key: "ferrosos", name: "Metais Ferrosos", icon: "⚙️" },
  { key: "nao-ferrosos", name: "Metais Não-Ferrosos", icon: "🔧" },
  { key: "cabos", name: "Cabos e Fios", icon: "🔌" },
  { key: "tubos", name: "Tubos e Estruturas", icon: "🚰" },
  { key: "eletronicos", name: "Eletrônicos", icon: "🔋" },
  { key: "automotivo", name: "Automotivo", icon: "🛞" },
  { key: "papel", name: "Papel", icon: "📦" },
  { key: "outros", name: "Outros", icon: "📦" },
];
