import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { TerminalTheme, ExportFormat, ImportedTheme } from "./types";

export class ExportManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getSupportedFormats(): ExportFormat[] {
    return [
      { format: "termistyle", extension: "termistyle", contentType: "application/json" },
      { format: "iterm2", extension: "itermcolors", contentType: "application/xml" },
      { format: "alacritty", extension: "yml", contentType: "text/yaml" },
      { format: "windows-terminal", extension: "json", contentType: "application/json" },
      { format: "hyper", extension: "js", contentType: "text/javascript" },
      { format: "kitty", extension: "conf", contentType: "text/plain" },
    ];
  }

  async exportTheme(theme: TerminalTheme, format: string, filePath: string): Promise<void> {
    let content: string;

    switch (format) {
      case "termistyle":
        content = this.exportToTermiStyle(theme);
        break;
      case "alacritty":
        content = this.exportToAlacritty(theme);
        break;
      case "windows-terminal":
        content = this.exportToWindowsTerminal(theme);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    await fs.promises.writeFile(filePath, content, "utf8");
  }

  async importTheme(filePath: string): Promise<ImportedTheme> {
    const content = await fs.promises.readFile(filePath, "utf8");
    const extension = path.extname(filePath).toLowerCase();

    let importedTheme: ImportedTheme;

    switch (extension) {
      case ".termistyle":
      case ".code-terminal-theme":
        importedTheme = this.importFromTermiStyle(content, filePath);
        break;
      case ".json":
        importedTheme = this.importFromJSON(content, filePath);
        break;
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }

    return importedTheme;
  }

  private exportToTermiStyle(theme: TerminalTheme): string {
    return JSON.stringify(theme, null, 2);
  }

  private exportToAlacritty(theme: TerminalTheme): string {
    return `# ${theme.name} - ${theme.description || "TermiStyle theme"}
colors:
  primary:
    background: '${theme.colors.background}'
    foreground: '${theme.colors.foreground}'
  
  normal:
    black:   '${theme.colors.ansiBlack}'
    red:     '${theme.colors.ansiRed}'
    green:   '${theme.colors.ansiGreen}'
    yellow:  '${theme.colors.ansiYellow}'
    blue:    '${theme.colors.ansiBlue}'
    magenta: '${theme.colors.ansiMagenta}'
    cyan:    '${theme.colors.ansiCyan}'
    white:   '${theme.colors.ansiWhite}'
  
  bright:
    black:   '${theme.colors.ansiBrightBlack}'
    red:     '${theme.colors.ansiBrightRed}'
    green:   '${theme.colors.ansiBrightGreen}'
    yellow:  '${theme.colors.ansiBrightYellow}'
    blue:    '${theme.colors.ansiBrightBlue}'
    magenta: '${theme.colors.ansiBrightMagenta}'
    cyan:    '${theme.colors.ansiBrightCyan}'
    white:   '${theme.colors.ansiBrightWhite}'`;
  }

  private exportToWindowsTerminal(theme: TerminalTheme): string {
    return JSON.stringify(
      {
        name: theme.name,
        background: theme.colors.background,
        foreground: theme.colors.foreground,
        black: theme.colors.ansiBlack,
        red: theme.colors.ansiRed,
        green: theme.colors.ansiGreen,
        yellow: theme.colors.ansiYellow,
        blue: theme.colors.ansiBlue,
        purple: theme.colors.ansiMagenta,
        cyan: theme.colors.ansiCyan,
        white: theme.colors.ansiWhite,
        brightBlack: theme.colors.ansiBrightBlack,
        brightRed: theme.colors.ansiBrightRed,
        brightGreen: theme.colors.ansiBrightGreen,
        brightYellow: theme.colors.ansiBrightYellow,
        brightBlue: theme.colors.ansiBrightBlue,
        brightPurple: theme.colors.ansiBrightMagenta,
        brightCyan: theme.colors.ansiBrightCyan,
        brightWhite: theme.colors.ansiBrightWhite,
      },
      null,
      2
    );
  }

  private importFromTermiStyle(content: string, filePath: string): ImportedTheme {
    try {
      const theme = JSON.parse(content) as TerminalTheme;
      return {
        source: filePath,
        format: "termistyle",
        theme: theme,
        warnings: [],
      };
    } catch (error) {
      throw new Error(`Invalid TermiStyle theme file: ${error}`);
    }
  }

  private importFromJSON(content: string, filePath: string): ImportedTheme {
    try {
      const json = JSON.parse(content);
      const warnings: string[] = [];

      // Check if it's a Windows Terminal theme
      if (json.name && json.background && json.foreground) {
        return this.importFromWindowsTerminal(json, filePath);
      }

      warnings.push("Generic JSON import - may require manual adjustment");

      return {
        source: filePath,
        format: "json",
        theme: {
          name: json.name || path.basename(filePath, ".json"),
          version: "1.0.0",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        } as any,
        warnings: warnings,
      };
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error}`);
    }
  }

  private importFromWindowsTerminal(json: any, filePath: string): ImportedTheme {
    const theme: Partial<TerminalTheme> = {
      name: json.name || path.basename(filePath, ".json"),
      version: "1.0.0",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),

      colors: {
        background: json.background || "#000000",
        foreground: json.foreground || "#ffffff",
        selection: json.selectionBackground || "#ffffff40",
        selectionBackground: json.selectionBackground || "#ffffff40",

        ansiBlack: json.black || "#000000",
        ansiRed: json.red || "#cd3131",
        ansiGreen: json.green || "#0dbc79",
        ansiYellow: json.yellow || "#e5e510",
        ansiBlue: json.blue || "#2472c8",
        ansiMagenta: json.purple || "#bc3fbc",
        ansiCyan: json.cyan || "#11a8cd",
        ansiWhite: json.white || "#e5e5e5",
        ansiBrightBlack: json.brightBlack || "#666666",
        ansiBrightRed: json.brightRed || "#f14c4c",
        ansiBrightGreen: json.brightGreen || "#23d18b",
        ansiBrightYellow: json.brightYellow || "#f5f543",
        ansiBrightBlue: json.brightBlue || "#3b8eea",
        ansiBrightMagenta: json.brightPurple || "#d670d6",
        ansiBrightCyan: json.brightCyan || "#29b8db",
        ansiBrightWhite: json.brightWhite || "#e5e5e5",

        border: "#333333",
        tab: {
          activeForeground: "#ffffff",
          activeBackground: "#333333",
          inactiveForeground: "#cccccc",
          inactiveBackground: "#2d2d30",
          border: "#333333",
        },
      },
    } as any;

    return {
      source: filePath,
      format: "windows-terminal",
      theme: theme,
      warnings: [],
    };
  }
}
