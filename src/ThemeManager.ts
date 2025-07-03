import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TerminalTheme, ThemeBackup, SystemFont } from "./types";

export class ThemeManager {
  private context: vscode.ExtensionContext;
  private backups: ThemeBackup[] = [];
  private originalSettings: any = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadBackups();
    this.backupOriginalSettings();
  }

  // Store original VS Code settings when extension starts
  private async backupOriginalSettings() {
    try {
      // Check if we already have original settings stored
      this.originalSettings = this.context.globalState.get("vibestudio.originalSettings", null);

      if (!this.originalSettings) {
        const config = vscode.workspace.getConfiguration();
        this.originalSettings = {
          workbenchColorCustomizations: config.get("workbench.colorCustomizations", {}),
          editorTokenColorCustomizations: config.get("editor.tokenColorCustomizations", {}),
          terminalIntegratedFontSize: config.get("terminal.integrated.fontSize"),
          terminalIntegratedFontFamily: config.get("terminal.integrated.fontFamily"),
          terminalIntegratedFontWeight: config.get("terminal.integrated.fontWeight"),
          terminalIntegratedLineHeight: config.get("terminal.integrated.lineHeight"),
          terminalIntegratedCursorStyle: config.get("terminal.integrated.cursorStyle"),
          terminalIntegratedCursorBlinking: config.get("terminal.integrated.cursorBlinking"),
          colorTheme: config.get("workbench.colorTheme"),
        };

        // Store in global state as backup
        await this.context.globalState.update("vibestudio.originalSettings", this.originalSettings);
      }
    } catch (error) {
      console.error("Failed to backup original settings:", error);
    }
  }

  async getSavedThemes(): Promise<TerminalTheme[]> {
    const themes = this.context.globalState.get<TerminalTheme[]>("vibestudio.savedThemes", []);
    return themes;
  }

  async saveTheme(theme: TerminalTheme): Promise<void> {
    const themes = await this.getSavedThemes();
    const existingIndex = themes.findIndex((t) => t.name === theme.name);

    theme.modified = new Date().toISOString();

    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      theme.created = new Date().toISOString();
      themes.push(theme);
    }

    await this.context.globalState.update("vibestudio.savedThemes", themes);
  }

  async deleteTheme(themeName: string): Promise<void> {
    const themes = await this.getSavedThemes();
    const filteredThemes = themes.filter((t) => t.name !== themeName);
    await this.context.globalState.update("vibestudio.savedThemes", filteredThemes);
  }

  async getCurrentTheme(): Promise<TerminalTheme | null> {
    const config = vscode.workspace.getConfiguration();
    const colorCustomizations = config.get("workbench.colorCustomizations", {}) as any;
    const tokenCustomizations = config.get("editor.tokenColorCustomizations", {}) as any;

    // Check if there are any editor/workbench customizations
    const hasEditorCustomizations = Object.keys(colorCustomizations).some(
      (key) =>
        key.startsWith("editor.") ||
        key.startsWith("activityBar.") ||
        key.startsWith("sideBar.") ||
        key.startsWith("statusBar.") ||
        key.startsWith("titleBar.") ||
        key.startsWith("tab.")
    );

    // Extract current terminal settings
    const currentTheme: TerminalTheme = {
      name: "Current Settings",
      version: "1.0.0",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),

      font: {
        family: config.get("terminal.integrated.fontFamily", ""),
        size: config.get("terminal.integrated.fontSize", 14),
        weight: config.get("terminal.integrated.fontWeight", "normal") as any,
        ligatures: config.get("editor.fontLigatures", false) as boolean,
        lineHeight: config.get("terminal.integrated.lineHeight", 1.2),
      },

      cursor: {
        style: config.get("terminal.integrated.cursorStyle", "block") as any,
        blinking: config.get("terminal.integrated.cursorBlinking", false),
        color: colorCustomizations["terminalCursor.foreground"] || "#ffffff",
      },

      colors: {
        background: colorCustomizations["terminal.background"] || "#000000",
        foreground: colorCustomizations["terminal.foreground"] || "#ffffff",
        selection: colorCustomizations["terminal.selectionBackground"] || "#ffffff40",
        selectionBackground: colorCustomizations["terminal.selectionBackground"] || "#ffffff40",

        ansiBlack: colorCustomizations["terminal.ansiBlack"] || "#000000",
        ansiRed: colorCustomizations["terminal.ansiRed"] || "#cd3131",
        ansiGreen: colorCustomizations["terminal.ansiGreen"] || "#0dbc79",
        ansiYellow: colorCustomizations["terminal.ansiYellow"] || "#e5e510",
        ansiBlue: colorCustomizations["terminal.ansiBlue"] || "#2472c8",
        ansiMagenta: colorCustomizations["terminal.ansiMagenta"] || "#bc3fbc",
        ansiCyan: colorCustomizations["terminal.ansiCyan"] || "#11a8cd",
        ansiWhite: colorCustomizations["terminal.ansiWhite"] || "#e5e5e5",
        ansiBrightBlack: colorCustomizations["terminal.ansiBrightBlack"] || "#666666",
        ansiBrightRed: colorCustomizations["terminal.ansiBrightRed"] || "#f14c4c",
        ansiBrightGreen: colorCustomizations["terminal.ansiBrightGreen"] || "#23d18b",
        ansiBrightYellow: colorCustomizations["terminal.ansiBrightYellow"] || "#f5f543",
        ansiBrightBlue: colorCustomizations["terminal.ansiBrightBlue"] || "#3b8eea",
        ansiBrightMagenta: colorCustomizations["terminal.ansiBrightMagenta"] || "#d670d6",
        ansiBrightCyan: colorCustomizations["terminal.ansiBrightCyan"] || "#29b8db",
        ansiBrightWhite: colorCustomizations["terminal.ansiBrightWhite"] || "#e5e5e5",

        border: colorCustomizations["terminal.border"] || "#333333",
        tab: {
          activeForeground: colorCustomizations["terminal.tab.activeForeground"] || "#ffffff",
          activeBackground: colorCustomizations["terminal.tab.activeBackground"] || "#333333",
          inactiveForeground: colorCustomizations["terminal.tab.inactiveForeground"] || "#cccccc",
          inactiveBackground: colorCustomizations["terminal.tab.inactiveBackground"] || "#2d2d30",
          border: colorCustomizations["terminal.tab.border"] || "#333333",
        },
      },

      integration: {
        applyToEditor: hasEditorCustomizations,
        applyToTerminal: true,
        applyToWorkbench: hasEditorCustomizations,
      },

      effects: {
        transparency: 0,
        blur: 0,
        animations: false,
        particleEffects: false,
        glowEffect: false,
        scanlines: false,
        crtEffect: false,
      },
    };

    // Add editor theme data if there are editor customizations
    if (hasEditorCustomizations) {
      currentTheme.editorTheme = {
        editor: {
          background: colorCustomizations["editor.background"] || "#1e1e1e",
          foreground: colorCustomizations["editor.foreground"] || "#d4d4d4",
          selectionBackground: colorCustomizations["editor.selectionBackground"] || "#264f78",
          selectionForeground: colorCustomizations["editor.selectionForeground"] || "#ffffff",
          lineHighlightBackground: colorCustomizations["editor.lineHighlightBackground"] || "#2a2d2e",
          cursorColor: colorCustomizations["editorCursor.foreground"] || "#ffffff",
          indentGuideBackground: colorCustomizations["editorIndentGuide.background"] || "#404040",
          indentGuideActiveBackground: colorCustomizations["editorIndentGuide.activeBackground"] || "#707070",
        },
        activityBar: {
          background: colorCustomizations["activityBar.background"] || "#333333",
          foreground: colorCustomizations["activityBar.foreground"] || "#ffffff",
          inactiveForeground: colorCustomizations["activityBar.inactiveForeground"] || "#ffffff66",
          border: colorCustomizations["activityBar.border"] || "#333333",
          activeBorder: colorCustomizations["activityBar.activeBorder"] || "#007acc",
          activeBackground: colorCustomizations["activityBar.activeBackground"] || "#333333",
        },
        sideBar: {
          background: colorCustomizations["sideBar.background"] || "#252526",
          foreground: colorCustomizations["sideBar.foreground"] || "#cccccc",
          border: colorCustomizations["sideBar.border"] || "#2d2d30",
        },
        statusBar: {
          background: colorCustomizations["statusBar.background"] || "#007acc",
          foreground: colorCustomizations["statusBar.foreground"] || "#ffffff",
          border: colorCustomizations["statusBar.border"] || "#007acc",
          debuggingBackground: colorCustomizations["statusBar.debuggingBackground"] || "#cc6633",
          debuggingForeground: colorCustomizations["statusBar.debuggingForeground"] || "#ffffff",
          noFolderBackground: colorCustomizations["statusBar.noFolderBackground"] || "#68217a",
          noFolderForeground: colorCustomizations["statusBar.noFolderForeground"] || "#ffffff",
        },
        titleBar: {
          activeBackground: colorCustomizations["titleBar.activeBackground"] || "#3c3c3c",
          activeForeground: colorCustomizations["titleBar.activeForeground"] || "#cccccc",
          inactiveBackground: colorCustomizations["titleBar.inactiveBackground"] || "#3c3c3c",
          inactiveForeground: colorCustomizations["titleBar.inactiveForeground"] || "#999999",
          border: colorCustomizations["titleBar.border"] || "#333333",
        },
        panel: {
          background: colorCustomizations["panel.background"] || "#1e1e1e",
          border: colorCustomizations["panel.border"] || "#333333",
          dropBorder: colorCustomizations["panel.dropBorder"] || "#007acc",
        },
        tab: {
          activeBackground: colorCustomizations["tab.activeBackground"] || "#1e1e1e",
          activeForeground: colorCustomizations["tab.activeForeground"] || "#ffffff",
          activeBorder: colorCustomizations["tab.activeBorder"] || "#007acc",
          activeBorderTop: colorCustomizations["tab.activeBorderTop"] || "#007acc",
          inactiveBackground: colorCustomizations["tab.inactiveBackground"] || "#2d2d30",
          inactiveForeground: colorCustomizations["tab.inactiveForeground"] || "#ffffff80",
          inactiveModifiedBorder: colorCustomizations["tab.inactiveModifiedBorder"] || "#3399cc",
          unfocusedActiveBackground: colorCustomizations["tab.unfocusedActiveBackground"] || "#1e1e1e",
          unfocusedActiveForeground: colorCustomizations["tab.unfocusedActiveForeground"] || "#ffffff80",
          unfocusedInactiveBackground: colorCustomizations["tab.unfocusedInactiveBackground"] || "#2d2d30",
          unfocusedInactiveForeground: colorCustomizations["tab.unfocusedInactiveForeground"] || "#ffffff40",
          border: colorCustomizations["tab.border"] || "#333333",
        },
        input: {
          background: colorCustomizations["input.background"] || "#3c3c3c",
          foreground: colorCustomizations["input.foreground"] || "#cccccc",
          border: colorCustomizations["input.border"] || "#3c3c3c",
          placeholderForeground: colorCustomizations["input.placeholderForeground"] || "#a6a6a6",
        },
        button: {
          background: colorCustomizations["button.background"] || "#0e639c",
          foreground: colorCustomizations["button.foreground"] || "#ffffff",
          hoverBackground: colorCustomizations["button.hoverBackground"] || "#1177bb",
          secondaryBackground: colorCustomizations["button.secondaryBackground"] || "#5f6a79",
          secondaryForeground: colorCustomizations["button.secondaryForeground"] || "#ffffff",
          secondaryHoverBackground: colorCustomizations["button.secondaryHoverBackground"] || "#4c5561",
        },
        checkbox: {
          background: colorCustomizations["checkbox.background"] || "#3c3c3c",
          foreground: colorCustomizations["checkbox.foreground"] || "#ffffff",
          border: colorCustomizations["checkbox.border"] || "#3c3c3c",
        },
        badge: {
          background: colorCustomizations["badge.background"] || "#007acc",
          foreground: colorCustomizations["badge.foreground"] || "#ffffff",
        },
        progressBar: {
          background: colorCustomizations["progressBar.background"] || "#007acc",
        },
        dropdown: {
          background: colorCustomizations["dropdown.background"] || "#3c3c3c",
          foreground: colorCustomizations["dropdown.foreground"] || "#cccccc",
          border: colorCustomizations["dropdown.border"] || "#3c3c3c",
        },
        list: {
          activeSelectionBackground: colorCustomizations["list.activeSelectionBackground"] || "#094771",
          activeSelectionForeground: colorCustomizations["list.activeSelectionForeground"] || "#ffffff",
          inactiveSelectionBackground: colorCustomizations["list.inactiveSelectionBackground"] || "#37373d",
          inactiveSelectionForeground: colorCustomizations["list.inactiveSelectionForeground"] || "#cccccc",
          hoverBackground: colorCustomizations["list.hoverBackground"] || "#2a2d2e",
          hoverForeground: colorCustomizations["list.hoverForeground"] || "#cccccc",
          focusBackground: colorCustomizations["list.focusBackground"] || "#062f4a",
          focusForeground: colorCustomizations["list.focusForeground"] || "#cccccc",
        },
        scrollbar: {
          shadow: colorCustomizations["scrollbar.shadow"] || "#000000",
        },
        syntax: {
          comment: tokenCustomizations.comments || "#6a9955",
          keyword: tokenCustomizations.keywords || "#569cd6",
          string: tokenCustomizations.strings || "#ce9178",
          number: tokenCustomizations.numbers || "#b5cea8",
          function: tokenCustomizations.functions || "#dcdcaa",
          variable: tokenCustomizations.variables || "#9cdcfe",
          type: tokenCustomizations.types || "#4ec9b0",
          class: tokenCustomizations.types || "#4ec9b0",
          interface: "#b8d7a3",
          namespace: tokenCustomizations.types || "#4ec9b0",
          operator: "#d4d4d4",
          punctuation: "#d4d4d4",
          constant: "#4fc1ff",
          property: tokenCustomizations.variables || "#9cdcfe",
          tag: tokenCustomizations.keywords || "#569cd6",
          attribute: "#92c5f8",
        },
      };
    }

    return currentTheme;
  }

  async applyTheme(theme: TerminalTheme): Promise<void> {
    // Create backup before applying
    if (vscode.workspace.getConfiguration("vibestudio").get("backup.enabled", true)) {
      await this.createBackup();
    }

    const config = vscode.workspace.getConfiguration();

    // Clear the base color theme when applying a custom theme
    await config.update("workbench.colorTheme", undefined, vscode.ConfigurationTarget.Global);

    const colorCustomizations = config.get("workbench.colorCustomizations", {}) as any;

    // Apply font settings
    await config.update("terminal.integrated.fontFamily", theme.font.family, vscode.ConfigurationTarget.Global);
    await config.update("terminal.integrated.fontSize", theme.font.size, vscode.ConfigurationTarget.Global);
    await config.update("terminal.integrated.fontWeight", theme.font.weight, vscode.ConfigurationTarget.Global);
    await config.update("terminal.integrated.lineHeight", theme.font.lineHeight, vscode.ConfigurationTarget.Global);

    // Apply cursor settings
    await config.update("terminal.integrated.cursorStyle", theme.cursor.style, vscode.ConfigurationTarget.Global);
    await config.update("terminal.integrated.cursorBlinking", theme.cursor.blinking, vscode.ConfigurationTarget.Global);

    // Apply color customizations
    const terminalColors = {
      "terminal.background": theme.colors.background,
      "terminal.foreground": theme.colors.foreground,
      "terminal.selectionBackground": theme.colors.selectionBackground,
      "terminal.ansiBlack": theme.colors.ansiBlack,
      "terminal.ansiRed": theme.colors.ansiRed,
      "terminal.ansiGreen": theme.colors.ansiGreen,
      "terminal.ansiYellow": theme.colors.ansiYellow,
      "terminal.ansiBlue": theme.colors.ansiBlue,
      "terminal.ansiMagenta": theme.colors.ansiMagenta,
      "terminal.ansiCyan": theme.colors.ansiCyan,
      "terminal.ansiWhite": theme.colors.ansiWhite,
      "terminal.ansiBrightBlack": theme.colors.ansiBrightBlack,
      "terminal.ansiBrightRed": theme.colors.ansiBrightRed,
      "terminal.ansiBrightGreen": theme.colors.ansiBrightGreen,
      "terminal.ansiBrightYellow": theme.colors.ansiBrightYellow,
      "terminal.ansiBrightBlue": theme.colors.ansiBrightBlue,
      "terminal.ansiBrightMagenta": theme.colors.ansiBrightMagenta,
      "terminal.ansiBrightCyan": theme.colors.ansiBrightCyan,
      "terminal.ansiBrightWhite": theme.colors.ansiBrightWhite,
      "terminal.border": theme.colors.border,
      "terminalCursor.foreground": theme.cursor.color,
      "terminalCursor.background": theme.colors.background,
    };

    // Apply additional integrations
    if (theme.integration.applyToEditor && theme.editorTheme) {
      // Apply comprehensive editor theme
      const editorColors = {
        // Editor Core
        "editor.background": theme.editorTheme.editor.background,
        "editor.foreground": theme.editorTheme.editor.foreground,
        "editor.selectionBackground": theme.editorTheme.editor.selectionBackground,
        "editor.selectionForeground": theme.editorTheme.editor.selectionForeground,
        "editor.lineHighlightBackground": theme.editorTheme.editor.lineHighlightBackground,
        "editorCursor.foreground": theme.editorTheme.editor.cursorColor,
        "editorIndentGuide.background": theme.editorTheme.editor.indentGuideBackground,
        "editorIndentGuide.activeBackground": theme.editorTheme.editor.indentGuideActiveBackground,

        // Activity Bar
        "activityBar.background": theme.editorTheme.activityBar.background,
        "activityBar.foreground": theme.editorTheme.activityBar.foreground,
        "activityBar.inactiveForeground": theme.editorTheme.activityBar.inactiveForeground,
        "activityBar.border": theme.editorTheme.activityBar.border,
        "activityBar.activeBorder": theme.editorTheme.activityBar.activeBorder,
        "activityBar.activeBackground": theme.editorTheme.activityBar.activeBackground,

        // Side Bar
        "sideBar.background": theme.editorTheme.sideBar.background,
        "sideBar.foreground": theme.editorTheme.sideBar.foreground,
        "sideBar.border": theme.editorTheme.sideBar.border,

        // Side Bar Section Header
        "sideBarSectionHeader.background": theme.editorTheme.sideBarSectionHeader?.background,
        "sideBarSectionHeader.foreground": theme.editorTheme.sideBarSectionHeader?.foreground,
        "sideBarSectionHeader.border": theme.editorTheme.sideBarSectionHeader?.border,

        // Panel Title
        "panel.background": theme.editorTheme.panelTitle?.background,
        "panelTitle.activeForeground": theme.editorTheme.panelTitle?.activeForeground,
        "panelTitle.activeBorder": theme.editorTheme.panelTitle?.activeBorder,
        "panelTitle.inactiveForeground": theme.editorTheme.panelTitle?.inactiveForeground,

        // Status Bar
        "statusBar.background": theme.editorTheme.statusBar.background,
        "statusBar.foreground": theme.editorTheme.statusBar.foreground,
        "statusBar.border": theme.editorTheme.statusBar.border,
        "statusBar.debuggingBackground": theme.editorTheme.statusBar.debuggingBackground,
        "statusBar.debuggingForeground": theme.editorTheme.statusBar.debuggingForeground,
        "statusBar.noFolderBackground": theme.editorTheme.statusBar.noFolderBackground,
        "statusBar.noFolderForeground": theme.editorTheme.statusBar.noFolderForeground,

        // Title Bar
        "titleBar.activeBackground": theme.editorTheme.titleBar.activeBackground,
        "titleBar.activeForeground": theme.editorTheme.titleBar.activeForeground,
        "titleBar.inactiveBackground": theme.editorTheme.titleBar.inactiveBackground,
        "titleBar.inactiveForeground": theme.editorTheme.titleBar.inactiveForeground,
        "titleBar.border": theme.editorTheme.titleBar.border,

        // Tabs
        "tab.activeBackground": theme.editorTheme.tab.activeBackground,
        "tab.activeForeground": theme.editorTheme.tab.activeForeground,
        "tab.activeBorder": theme.editorTheme.tab.activeBorder,
        "tab.activeBorderTop": theme.editorTheme.tab.activeBorderTop,
        "tab.inactiveBackground": theme.editorTheme.tab.inactiveBackground,
        "tab.inactiveForeground": theme.editorTheme.tab.inactiveForeground,
        "tab.inactiveModifiedBorder": theme.editorTheme.tab.inactiveModifiedBorder,
        "tab.unfocusedActiveBackground": theme.editorTheme.tab.unfocusedActiveBackground,
        "tab.unfocusedActiveForeground": theme.editorTheme.tab.unfocusedActiveForeground,
        "tab.unfocusedInactiveBackground": theme.editorTheme.tab.unfocusedInactiveBackground,
        "tab.unfocusedInactiveForeground": theme.editorTheme.tab.unfocusedInactiveForeground,
        "tab.border": theme.editorTheme.tab.border,

        // Input Controls
        "input.background": theme.editorTheme.input.background,
        "input.foreground": theme.editorTheme.input.foreground,
        "input.border": theme.editorTheme.input.border,
        "input.placeholderForeground": theme.editorTheme.input.placeholderForeground,

        // Dropdown
        "dropdown.background": theme.editorTheme.dropdown.background,
        "dropdown.foreground": theme.editorTheme.dropdown.foreground,
        "dropdown.border": theme.editorTheme.dropdown.border,

        // Button
        "button.background": theme.editorTheme.button.background,
        "button.foreground": theme.editorTheme.button.foreground,
        "button.hoverBackground": theme.editorTheme.button.hoverBackground,
        "button.secondaryBackground": theme.editorTheme.button.secondaryBackground,
        "button.secondaryForeground": theme.editorTheme.button.secondaryForeground,
        "button.secondaryHoverBackground": theme.editorTheme.button.secondaryHoverBackground,

        // Checkbox
        "checkbox.background": theme.editorTheme.checkbox.background,
        "checkbox.foreground": theme.editorTheme.checkbox.foreground,
        "checkbox.border": theme.editorTheme.checkbox.border,

        // Badge
        "badge.background": theme.editorTheme.badge.background,
        "badge.foreground": theme.editorTheme.badge.foreground,

        // Progress Bar
        "progressBar.background": theme.editorTheme.progressBar.background,

        // List & Tree
        "list.activeSelectionBackground": theme.editorTheme.list.activeSelectionBackground,
        "list.activeSelectionForeground": theme.editorTheme.list.activeSelectionForeground,
        "list.inactiveSelectionBackground": theme.editorTheme.list.inactiveSelectionBackground,
        "list.inactiveSelectionForeground": theme.editorTheme.list.inactiveSelectionForeground,
        "list.hoverBackground": theme.editorTheme.list.hoverBackground,
        "list.hoverForeground": theme.editorTheme.list.hoverForeground,
        "list.focusBackground": theme.editorTheme.list.focusBackground,
        "list.focusForeground": theme.editorTheme.list.focusForeground,
      };

      Object.assign(colorCustomizations, editorColors);

      // Apply token color customizations separately
      const tokenColorCustomizations = {
        comments: theme.editorTheme.syntax.comment,
        keywords: theme.editorTheme.syntax.keyword,
        strings: theme.editorTheme.syntax.string,
        numbers: theme.editorTheme.syntax.number,
        functions: theme.editorTheme.syntax.function,
        variables: theme.editorTheme.syntax.variable,
        types: theme.editorTheme.syntax.type,
        textMateRules: [
          {
            scope: "comment",
            settings: {
              foreground: theme.editorTheme.syntax.comment,
            },
          },
          {
            scope: ["keyword", "storage.type", "storage.modifier"],
            settings: {
              foreground: theme.editorTheme.syntax.keyword,
            },
          },
          {
            scope: ["string", "string.quoted"],
            settings: {
              foreground: theme.editorTheme.syntax.string,
            },
          },
          {
            scope: ["constant.numeric", "constant.language"],
            settings: {
              foreground: theme.editorTheme.syntax.number,
            },
          },
          {
            scope: ["entity.name.function", "support.function"],
            settings: {
              foreground: theme.editorTheme.syntax.function,
            },
          },
          {
            scope: ["variable", "variable.other"],
            settings: {
              foreground: theme.editorTheme.syntax.variable,
            },
          },
          {
            scope: ["entity.name.type", "support.type", "storage.type"],
            settings: {
              foreground: theme.editorTheme.syntax.type,
            },
          },
          {
            scope: ["entity.name.class", "support.class"],
            settings: {
              foreground: theme.editorTheme.syntax.class,
            },
          },
        ],
      };

      await config.update("editor.tokenColorCustomizations", tokenColorCustomizations, vscode.ConfigurationTarget.Global);
    } else if (theme.integration.applyToEditor) {
      // Fallback to basic editor colors if no editorTheme data
      Object.assign(colorCustomizations, {
        "editor.background": theme.colors.background,
        "editor.foreground": theme.colors.foreground,
        "editor.selectionBackground": theme.colors.selectionBackground,
      });
    }

    if (theme.integration.applyToWorkbench && !theme.editorTheme) {
      // Basic workbench colors if no editor theme
      Object.assign(colorCustomizations, {
        "sideBar.background": theme.colors.background,
        "activityBar.background": theme.colors.background,
        "statusBar.background": theme.colors.background,
        "titleBar.activeBackground": theme.colors.background,
      });
    }

    // Merge terminal colors with existing customizations
    Object.assign(colorCustomizations, terminalColors);

    await config.update("workbench.colorCustomizations", colorCustomizations, vscode.ConfigurationTarget.Global);

    // Apply font ligatures if supported
    if (theme.font.ligatures) {
      await config.update("editor.fontLigatures", true, vscode.ConfigurationTarget.Global);
    }

    // Apply custom CSS for effects (if supported by extensions)
    if (theme.integration.customCss) {
      await this.applyCustomEffects(theme);
    }

    // Store current applied theme
    await this.context.globalState.update("vibestudio.currentTheme", theme);
  }

  private async applyCustomEffects(theme: TerminalTheme): Promise<void> {
    // This would integrate with extensions like "Custom CSS and JS Loader"
    // or apply effects through available VS Code APIs

    if (theme.effects.transparency > 0) {
      // Apply transparency through workbench settings
      const config = vscode.workspace.getConfiguration();
      const colorCustomizations = config.get("workbench.colorCustomizations", {}) as any;

      // Convert transparency percentage to alpha
      const alpha = Math.round((100 - theme.effects.transparency) * 2.55)
        .toString(16)
        .padStart(2, "0");

      colorCustomizations["terminal.background"] = theme.colors.background + alpha;
      await config.update("workbench.colorCustomizations", colorCustomizations, vscode.ConfigurationTarget.Global);
    }
  }

  async resetToDefault(): Promise<void> {
    try {
      // Create backup before reset
      await this.createBackup();

      const config = vscode.workspace.getConfiguration();

      // Reset to VS Code's default dark theme
      await config.update("workbench.colorTheme", "Dark+", vscode.ConfigurationTarget.Global);
      await config.update("workbench.colorCustomizations", {}, vscode.ConfigurationTarget.Global);
      await config.update("editor.tokenColorCustomizations", {}, vscode.ConfigurationTarget.Global);

      // Reset terminal settings to defaults
      await config.update("terminal.integrated.fontFamily", undefined, vscode.ConfigurationTarget.Global);
      await config.update("terminal.integrated.fontSize", undefined, vscode.ConfigurationTarget.Global);
      await config.update("terminal.integrated.fontWeight", undefined, vscode.ConfigurationTarget.Global);
      await config.update("terminal.integrated.lineHeight", undefined, vscode.ConfigurationTarget.Global);
      await config.update("terminal.integrated.cursorStyle", undefined, vscode.ConfigurationTarget.Global);
      await config.update("terminal.integrated.cursorBlinking", undefined, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage("✅ VS Code theme reset to default dark theme");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reset theme: ${error}`);
    }
  }

  async resetToDefaultColors(): Promise<void> {
    try {
      // Create backup before reset
      await this.createBackup();

      const config = vscode.workspace.getConfiguration();

      // Only remove the color customizations, don't touch other settings
      await config.update("workbench.colorTheme", undefined, vscode.ConfigurationTarget.Global);
      await config.update("workbench.colorCustomizations", {}, vscode.ConfigurationTarget.Global);
      await config.update("editor.tokenColorCustomizations", {}, vscode.ConfigurationTarget.Global);

      // Reset font size to default
      await config.update("terminal.integrated.fontSize", 14, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage("✅ Color customizations reset to default");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to reset color customizations: ${error}`);
    }
  }

  async createBackup(): Promise<void> {
    const config = vscode.workspace.getConfiguration();
    const currentTheme = await this.getCurrentTheme();

    const backup: ThemeBackup = {
      timestamp: new Date().toISOString(),
      settings: {
        "terminal.integrated.fontFamily": config.get("terminal.integrated.fontFamily"),
        "terminal.integrated.fontSize": config.get("terminal.integrated.fontSize"),
        "terminal.integrated.fontWeight": config.get("terminal.integrated.fontWeight"),
        "terminal.integrated.lineHeight": config.get("terminal.integrated.lineHeight"),
        "terminal.integrated.cursorStyle": config.get("terminal.integrated.cursorStyle"),
        "terminal.integrated.cursorBlinking": config.get("terminal.integrated.cursorBlinking"),
        "workbench.colorTheme": config.get("workbench.colorTheme"),
        "workbench.colorCustomizations": config.get("workbench.colorCustomizations"),
      },
      theme: currentTheme || undefined,
    };

    this.backups.unshift(backup);

    // Keep only last 10 backups
    if (this.backups.length > 10) {
      this.backups = this.backups.slice(0, 10);
    }

    await this.saveBackups();
  }

  async restoreBackup(timestamp: string): Promise<void> {
    const backup = this.backups.find((b) => b.timestamp === timestamp);
    if (!backup) {
      throw new Error("Backup not found");
    }

    const config = vscode.workspace.getConfiguration();

    // Restore all settings from backup
    for (const [key, value] of Object.entries(backup.settings)) {
      await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
  }

  getBackups(): ThemeBackup[] {
    return [...this.backups];
  }

  private async loadBackups(): Promise<void> {
    this.backups = this.context.globalState.get<ThemeBackup[]>("termistyle.backups", []);
  }

  private async saveBackups(): Promise<void> {
    await this.context.globalState.update("termistyle.backups", this.backups);
  }

  async getSystemFonts(): Promise<SystemFont[]> {
    // This is a simplified implementation
    // In a real extension, you might use native modules or system calls
    const commonMonospaceFonts: SystemFont[] = [
      { family: "Consolas", variants: ["Regular", "Bold"], monospace: true, ligatures: false },
      { family: "Monaco", variants: ["Regular"], monospace: true, ligatures: false },
      { family: "Menlo", variants: ["Regular", "Bold"], monospace: true, ligatures: false },
      { family: "Courier New", variants: ["Regular", "Bold"], monospace: true, ligatures: false },
      { family: "Source Code Pro", variants: ["Light", "Regular", "Medium", "Bold"], monospace: true, ligatures: false },
      { family: "Fira Code", variants: ["Light", "Regular", "Medium", "Bold"], monospace: true, ligatures: true },
      { family: "JetBrains Mono", variants: ["Light", "Regular", "Medium", "Bold"], monospace: true, ligatures: true },
      { family: "Cascadia Code", variants: ["Light", "Regular", "SemiBold", "Bold"], monospace: true, ligatures: true },
      { family: "SF Mono", variants: ["Light", "Regular", "Medium", "Bold"], monospace: true, ligatures: false },
      { family: "Roboto Mono", variants: ["Light", "Regular", "Medium", "Bold"], monospace: true, ligatures: false },
    ];

    return commonMonospaceFonts;
  }

  async createDefaultTheme(): Promise<TerminalTheme> {
    const defaultTheme: TerminalTheme = {
      name: "Default Terminal",
      version: "1.0.0",
      author: "TermiStyle",
      description: "VS Code default terminal theme",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),

      font: {
        family: "Consolas, monospace",
        size: 14,
        weight: "normal",
        ligatures: false,
        lineHeight: 1.2,
      },

      cursor: {
        style: "block",
        blinking: false,
        color: "#ffffff",
      },

      colors: {
        background: "#000000",
        foreground: "#ffffff",
        selection: "#ffffff40",
        selectionBackground: "#ffffff40",

        ansiBlack: "#000000",
        ansiRed: "#cd3131",
        ansiGreen: "#0dbc79",
        ansiYellow: "#e5e510",
        ansiBlue: "#2472c8",
        ansiMagenta: "#bc3fbc",
        ansiCyan: "#11a8cd",
        ansiWhite: "#e5e5e5",
        ansiBrightBlack: "#666666",
        ansiBrightRed: "#f14c4c",
        ansiBrightGreen: "#23d18b",
        ansiBrightYellow: "#f5f543",
        ansiBrightBlue: "#3b8eea",
        ansiBrightMagenta: "#d670d6",
        ansiBrightCyan: "#29b8db",
        ansiBrightWhite: "#e5e5e5",

        border: "#333333",
        tab: {
          activeForeground: "#ffffff",
          activeBackground: "#333333",
          inactiveForeground: "#cccccc",
          inactiveBackground: "#2d2d30",
          border: "#333333",
        },
      },

      integration: {
        applyToEditor: false,
        applyToTerminal: true,
        applyToWorkbench: false,
      },

      effects: {
        transparency: 0,
        blur: 0,
        animations: false,
        particleEffects: false,
        glowEffect: false,
        scanlines: false,
        crtEffect: false,
      },
    };

    return defaultTheme;
  }
}
