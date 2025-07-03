export interface TerminalTheme {
  name: string;
  version: string;
  author?: string;
  description?: string;
  created: string;
  modified: string;

  // Font settings
  font: {
    family: string;
    size: number;
    weight: "normal" | "bold" | "100" | "200" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    ligatures: boolean;
    lineHeight: number;
  };

  // Cursor settings
  cursor: {
    style: "block" | "line" | "underline";
    blinking: boolean;
    color: string;
  };

  // Colors
  colors: {
    // Basic terminal colors
    background: string;
    foreground: string;
    selection: string;
    selectionBackground: string;

    // ANSI colors (16 colors)
    ansiBlack: string;
    ansiRed: string;
    ansiGreen: string;
    ansiYellow: string;
    ansiBlue: string;
    ansiMagenta: string;
    ansiCyan: string;
    ansiWhite: string;
    ansiBrightBlack: string;
    ansiBrightRed: string;
    ansiBrightGreen: string;
    ansiBrightYellow: string;
    ansiBrightBlue: string;
    ansiBrightMagenta: string;
    ansiBrightCyan: string;
    ansiBrightWhite: string;

    // Additional terminal colors
    border: string;
    tab: {
      activeForeground: string;
      activeBackground: string;
      inactiveForeground: string;
      inactiveBackground: string;
      border: string;
    };
  };

  // VS Code Editor Theme Colors
  editorTheme?: {
    // Editor Core
    editor: {
      background: string;
      foreground: string;
      selectionBackground: string;
      selectionForeground?: string;
      lineHighlightBackground: string;
      cursorColor: string;
      indentGuideBackground: string;
      indentGuideActiveBackground: string;
    };

    // Activity Bar
    activityBar: {
      background: string;
      foreground: string;
      inactiveForeground: string;
      border: string;
      activeBorder: string;
      activeBackground: string;
    };

    // Side Bar
    sideBar: {
      background: string;
      foreground: string;
      border: string;
    };

    // Side Bar Section Header
    sideBarSectionHeader?: {
      background: string;
      foreground: string;
      border: string;
    };

    // Status Bar
    statusBar: {
      background: string;
      foreground: string;
      border: string;
      debuggingBackground: string;
      debuggingForeground: string;
      noFolderBackground: string;
      noFolderForeground: string;
    };

    // Title Bar
    titleBar: {
      activeBackground: string;
      activeForeground: string;
      inactiveBackground: string;
      inactiveForeground: string;
      border: string;
    };

    // Panel (Terminal, Problems, Output, etc.)
    panel: {
      background: string;
      border: string;
      dropBorder: string;
    };

    // Tabs
    tab: {
      activeBackground: string;
      activeForeground: string;
      activeBorder: string;
      activeBorderTop: string;
      inactiveBackground: string;
      inactiveForeground: string;
      inactiveModifiedBorder: string;
      unfocusedActiveBackground: string;
      unfocusedActiveForeground: string;
      unfocusedInactiveBackground: string;
      unfocusedInactiveForeground: string;
      border: string;
    };

    // Input Controls
    input: {
      background: string;
      foreground: string;
      border: string;
      placeholderForeground: string;
    };

    // Dropdown
    dropdown: {
      background: string;
      foreground: string;
      border: string;
    };

    // Button
    button: {
      background: string;
      foreground: string;
      hoverBackground: string;
      secondaryBackground: string;
      secondaryForeground: string;
      secondaryHoverBackground: string;
    };

    // Checkbox
    checkbox: {
      background: string;
      foreground: string;
      border: string;
    };

    // Badge
    badge: {
      background: string;
      foreground: string;
    };

    // Progress Bar
    progressBar: {
      background: string;
    };

    // List & Tree
    list: {
      activeSelectionBackground: string;
      activeSelectionForeground: string;
      inactiveSelectionBackground: string;
      inactiveSelectionForeground: string;
      hoverBackground: string;
      hoverForeground: string;
      focusBackground: string;
      focusForeground: string;
    };

    // Scrollbar
    scrollbar: {
      shadow: string;
    };

    // Syntax Highlighting
    syntax: {
      comment: string;
      keyword: string;
      string: string;
      number: string;
      function: string;
      variable: string;
      type: string;
      class: string;
      interface: string;
      namespace: string;
      operator: string;
      punctuation: string;
      constant: string;
      property: string;
      tag: string;
      attribute: string;
    };
  };

  // VS Code integration settings
  integration: {
    applyToEditor: boolean;
    applyToTerminal: boolean;
    applyToWorkbench: boolean;
    customCss?: string;
  };

  // Effects and animations
  effects: {
    transparency: number; // 0-100
    blur: number; // 0-10
    animations: boolean;
    particleEffects: boolean;
    glowEffect: boolean;
    scanlines: boolean;
    crtEffect: boolean;
  };
}

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  grayscale: string[];
  rainbow: string[];
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category:
    | "dark"
    | "light"
    | "high-contrast"
    | "retro"
    | "modern"
    | "colorful"
    | "cyberpunk"
    | "nature"
    | "pastel"
    | "warm"
    | "gothic"
    | "neon";
  theme: TerminalTheme;
  preview: string; // Base64 encoded image or SVG
}

export interface AutoSwitchConfig {
  enabled: boolean;
  mode: "time" | "system";
  lightTheme: string;
  darkTheme: string;
  lightHour: number;
  darkHour: number;
}

export interface ExportFormat {
  format: "termistyle" | "iterm2" | "alacritty" | "windows-terminal" | "hyper" | "kitty";
  extension: string;
  contentType: string;
}

export interface ImportedTheme {
  source: string;
  format: string;
  theme: Partial<TerminalTheme>;
  warnings: string[];
}

export interface ThemeBackup {
  timestamp: string;
  settings: { [key: string]: any };
  theme?: TerminalTheme;
}

export interface WebviewMessage {
  type:
    | "themeUpdate"
    | "applyTheme"
    | "saveTheme"
    | "loadTheme"
    | "exportTheme"
    | "importTheme"
    | "resetTheme"
    | "getPresets"
    | "getSystemFonts"
    | "previewToggle";
  data?: any;
}

export interface SystemFont {
  family: string;
  variants: string[];
  monospace: boolean;
  ligatures: boolean;
}
