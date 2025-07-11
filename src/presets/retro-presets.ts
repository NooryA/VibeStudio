import { ThemePreset } from "../types";

export const retroPresets: ThemePreset[] = [
  // 📺 Vintage Sepia - Old-school sepia tones
  {
    id: "vintage-sepia",
    name: "📺 Vintage Sepia",
    description: "Old-school sepia tones with vintage newspaper aesthetic",
    category: "retro",
    preview: "",
    theme: {
      name: "Vintage Sepia",
      version: "1.0.0",
      author: "VibeStudio",
      description: "Old-school sepia tones with vintage newspaper aesthetic",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),

      font: {
        family: "Courier New, monospace",
        size: 14,
        weight: "normal",
        ligatures: false,
        lineHeight: 1.4,
      },

      cursor: {
        style: "block",
        blinking: false,
        color: "#8b4513",
      },

      colors: {
        background: "#f5deb3",
        foreground: "#654321",
        selection: "#deb887",
        selectionBackground: "#deb887",

        ansiBlack: "#654321",
        ansiRed: "#a0522d",
        ansiGreen: "#8b4513",
        ansiYellow: "#daa520",
        ansiBlue: "#4682b4",
        ansiMagenta: "#d2691e",
        ansiCyan: "#5f9ea0",
        ansiWhite: "#f5deb3",
        ansiBrightBlack: "#8b4513",
        ansiBrightRed: "#cd853f",
        ansiBrightGreen: "#a0522d",
        ansiBrightYellow: "#f4a460",
        ansiBrightBlue: "#6495ed",
        ansiBrightMagenta: "#daa520",
        ansiBrightCyan: "#7ba428",
        ansiBrightWhite: "#ffffff",

        border: "#deb887",
        tab: {
          activeForeground: "#654321",
          activeBackground: "#f5deb3",
          inactiveForeground: "#8b4513",
          inactiveBackground: "#deb887",
          border: "#deb887",
        },
      },

      integration: {
        applyToEditor: true,
        applyToTerminal: true,
        applyToWorkbench: true,
      },

      editorTheme: {
        editor: {
          background: "#f5deb3",
          foreground: "#654321",
          selectionBackground: "#deb88780",
          selectionForeground: "#654321",
          lineHighlightBackground: "#f0e68c",
          cursorColor: "#8b4513",
          indentGuideBackground: "#deb887",
          indentGuideActiveBackground: "#8b4513",
        },
        activityBar: {
          background: "#deb887",
          foreground: "#654321",
          inactiveForeground: "#8b4513",
          border: "#cd853f",
          activeBorder: "#8b4513",
          activeBackground: "#f5deb3",
        },
        sideBar: {
          background: "#f5deb3",
          foreground: "#654321",
          border: "#cd853f",
        },
        sideBarSectionHeader: {
          background: "#deb887",
          foreground: "#654321",
          border: "#8b4513",
        },
        panelTitle: {
          background: "#f5deb3",
          activeForeground: "#654321",
          activeBorder: "#8b4513",
          inactiveForeground: "#8b4513",
        },
        statusBar: {
          background: "#8b4513",
          foreground: "#f5deb3",
          border: "#8b4513",
          debuggingBackground: "#a0522d",
          debuggingForeground: "#f5deb3",
          noFolderBackground: "#daa520",
          noFolderForeground: "#654321",
        },
        titleBar: {
          activeBackground: "#deb887",
          activeForeground: "#654321",
          inactiveBackground: "#f5deb3",
          inactiveForeground: "#8b4513",
          border: "#cd853f",
        },
        panel: {
          background: "#f5deb3",
          border: "#cd853f",
          dropBorder: "#8b4513",
        },
        tab: {
          background: "#deb887",
          activeBackground: "#f5deb3",
          activeForeground: "#654321",
          activeBorder: "#8b4513",
          activeBorderTop: "#8b4513",
          inactiveBackground: "#deb887",
          inactiveForeground: "#8b4513",
          inactiveModifiedBorder: "#daa520",
          unfocusedActiveBackground: "#deb887",
          unfocusedActiveForeground: "#8b4513",
          unfocusedInactiveBackground: "#f0e68c",
          unfocusedInactiveForeground: "#a0522d",
          border: "#cd853f",
        },
        input: {
          background: "#ffffff",
          foreground: "#654321",
          border: "#cd853f",
          placeholderForeground: "#8b4513",
        },
        button: {
          background: "#8b4513",
          foreground: "#f5deb3",
          hoverBackground: "#a0522d",
          secondaryBackground: "#deb887",
          secondaryForeground: "#654321",
          secondaryHoverBackground: "#cd853f",
        },
        checkbox: {
          background: "#ffffff",
          foreground: "#654321",
          border: "#cd853f",
        },
        badge: {
          background: "#8b4513",
          foreground: "#f5deb3",
        },
        progressBar: {
          background: "#8b4513",
        },
        dropdown: {
          background: "#ffffff",
          foreground: "#654321",
          border: "#cd853f",
        },
        list: {
          activeSelectionBackground: "#deb88780",
          activeSelectionForeground: "#654321",
          inactiveSelectionBackground: "#deb887",
          inactiveSelectionForeground: "#654321",
          hoverBackground: "#f0e68c",
          hoverForeground: "#654321",
          focusBackground: "#deb88780",
          focusForeground: "#654321",
        },
        scrollbar: {
          shadow: "#f5f5dc",
          sliderBackground: "#8b4513",
          sliderHoverBackground: "#a0522d",
          sliderActiveBackground: "#d2691e",
        },
        breadcrumb: {
          background: "#f0e68c",
        },
        editorGutter: {
          background: "#f0e68c",
        },
        minimap: {
          background: "#ffeaa7",
          sliderBackground: "#8b451360",
          sliderHoverBackground: "#8b451380",
          sliderActiveBackground: "#8b4513a0",
        },
        syntax: {
          comment: "#8b4513",
          keyword: "#8b4513",
          string: "#a0522d",
          number: "#daa520",
          function: "#4682b4",
          variable: "#654321",
          type: "#d2691e",
          class: "#a0522d",
          interface: "#5f9ea0",
          namespace: "#4682b4",
          operator: "#8b4513",
          punctuation: "#654321",
          constant: "#daa520",
          property: "#654321",
          tag: "#a0522d",
          attribute: "#d2691e",
        },
      },

      effects: {
        transparency: 3,
        blur: 1,
        animations: false,
        particleEffects: false,
        glowEffect: false,
        scanlines: true,
        crtEffect: true,
      },
    },
  },

  // 🧿 Steampunk Bronze - Brass and copper steampunk aesthetic
  {
    id: "steampunk-bronze",
    name: "🧿 Steampunk Bronze",
    description: "Brass and copper steampunk aesthetic with industrial vibes",
    category: "retro",
    preview: "",
    theme: {
      name: "Steampunk Bronze",
      version: "1.0.0",
      author: "VibeStudio",
      description: "Brass and copper steampunk aesthetic with industrial vibes",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),

      font: {
        family: "PT Mono, monospace",
        size: 14,
        weight: "normal",
        ligatures: false,
        lineHeight: 1.3,
      },

      cursor: {
        style: "block",
        blinking: true,
        color: "#cd7f32",
      },

      colors: {
        background: "#2f1b14",
        foreground: "#d2b48c",
        selection: "#8b4513",
        selectionBackground: "#8b4513",

        ansiBlack: "#2f1b14",
        ansiRed: "#a0522d",
        ansiGreen: "#b8860b",
        ansiYellow: "#daa520",
        ansiBlue: "#4682b4",
        ansiMagenta: "#cd853f",
        ansiCyan: "#5f9ea0",
        ansiWhite: "#d2b48c",
        ansiBrightBlack: "#654321",
        ansiBrightRed: "#cd853f",
        ansiBrightGreen: "#daa520",
        ansiBrightYellow: "#ffd700",
        ansiBrightBlue: "#6495ed",
        ansiBrightMagenta: "#deb887",
        ansiBrightCyan: "#7ba428",
        ansiBrightWhite: "#ffffff",

        border: "#654321",
        tab: {
          activeForeground: "#d2b48c",
          activeBackground: "#2f1b14",
          inactiveForeground: "#cd853f",
          inactiveBackground: "#654321",
          border: "#654321",
        },
      },

      integration: {
        applyToEditor: true,
        applyToTerminal: true,
        applyToWorkbench: true,
      },

      editorTheme: {
        editor: {
          background: "#2f1b14",
          foreground: "#d2b48c",
          selectionBackground: "#8b451380",
          selectionForeground: "#ffffff",
          lineHighlightBackground: "#3d2317",
          cursorColor: "#cd7f32",
          indentGuideBackground: "#654321",
          indentGuideActiveBackground: "#cd7f32",
        },
        activityBar: {
          background: "#3d2317",
          foreground: "#d2b48c",
          inactiveForeground: "#cd853f",
          border: "#654321",
          activeBorder: "#cd7f32",
          activeBackground: "#2f1b14",
        },
        sideBar: {
          background: "#2f1b14",
          foreground: "#d2b48c",
          border: "#654321",
        },
        sideBarSectionHeader: {
          background: "#3d2317",
          foreground: "#d2b48c",
          border: "#cd7f32",
        },
        panelTitle: {
          background: "#2f1b14",
          activeForeground: "#d2b48c",
          activeBorder: "#cd7f32",
          inactiveForeground: "#cd853f",
        },
        statusBar: {
          background: "#cd7f32",
          foreground: "#2f1b14",
          border: "#cd7f32",
          debuggingBackground: "#a0522d",
          debuggingForeground: "#ffffff",
          noFolderBackground: "#daa520",
          noFolderForeground: "#2f1b14",
        },
        titleBar: {
          activeBackground: "#3d2317",
          activeForeground: "#d2b48c",
          inactiveBackground: "#2f1b14",
          inactiveForeground: "#cd853f",
          border: "#654321",
        },
        panel: {
          background: "#2f1b14",
          border: "#654321",
          dropBorder: "#cd7f32",
        },
        tab: {
          background: "#000000",
          activeBackground: "#2f1b14",
          activeForeground: "#d2b48c",
          activeBorder: "#cd7f32",
          activeBorderTop: "#cd7f32",
          inactiveBackground: "#3d2317",
          inactiveForeground: "#cd853f",
          inactiveModifiedBorder: "#daa520",
          unfocusedActiveBackground: "#3d2317",
          unfocusedActiveForeground: "#cd853f",
          unfocusedInactiveBackground: "#2f1b14",
          unfocusedInactiveForeground: "#654321",
          border: "#654321",
        },
        input: {
          background: "#3d2317",
          foreground: "#d2b48c",
          border: "#654321",
          placeholderForeground: "#cd853f",
        },
        button: {
          background: "#cd7f32",
          foreground: "#2f1b14",
          hoverBackground: "#daa520",
          secondaryBackground: "#654321",
          secondaryForeground: "#d2b48c",
          secondaryHoverBackground: "#8b4513",
        },
        checkbox: {
          background: "#3d2317",
          foreground: "#d2b48c",
          border: "#654321",
        },
        badge: {
          background: "#cd7f32",
          foreground: "#2f1b14",
        },
        progressBar: {
          background: "#cd7f32",
        },
        dropdown: {
          background: "#3d2317",
          foreground: "#d2b48c",
          border: "#654321",
        },
        list: {
          activeSelectionBackground: "#8b451380",
          activeSelectionForeground: "#ffffff",
          inactiveSelectionBackground: "#654321",
          inactiveSelectionForeground: "#d2b48c",
          hoverBackground: "#3d2317",
          hoverForeground: "#d2b48c",
          focusBackground: "#8b451380",
          focusForeground: "#ffffff",
        },
        scrollbar: {
          shadow: "#f5f5dc",
          sliderBackground: "#8b4513",
          sliderHoverBackground: "#a0522d",
          sliderActiveBackground: "#d2691e",
        },
        breadcrumb: {
          background: "#2f1b14",
        },
        editorGutter: {
          background: "#2f1b14",
        },
        minimap: {
          background: "#3d2317",
          sliderBackground: "#cd7f3260",
          sliderHoverBackground: "#cd7f3280",
          sliderActiveBackground: "#cd7f32a0",
        },
        syntax: {
          comment: "#cd853f",
          keyword: "#cd7f32",
          string: "#b8860b",
          number: "#daa520",
          function: "#4682b4",
          variable: "#d2b48c",
          type: "#cd853f",
          class: "#a0522d",
          interface: "#5f9ea0",
          namespace: "#4682b4",
          operator: "#cd7f32",
          punctuation: "#d2b48c",
          constant: "#daa520",
          property: "#d2b48c",
          tag: "#a0522d",
          attribute: "#cd853f",
        },
      },

      effects: {
        transparency: 5,
        blur: 1,
        animations: false,
        particleEffects: false,
        glowEffect: false,
        scanlines: true,
        crtEffect: true,
      },
    },
  },
];
