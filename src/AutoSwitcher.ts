import * as vscode from "vscode";
import { ThemeManager } from "./ThemeManager";
import { AutoSwitchConfig } from "./types";

export class AutoSwitcher {
  private context: vscode.ExtensionContext;
  private themeManager: ThemeManager;
  private config: AutoSwitchConfig;
  private timer: NodeJS.Timer | undefined;
  private systemThemeWatcher: vscode.Disposable | undefined;

  constructor(context: vscode.ExtensionContext, themeManager: ThemeManager) {
    this.context = context;
    this.themeManager = themeManager;
    this.config = this.loadConfig();
  }

  initialize() {
    if (this.config.enabled) {
      this.enable();
    }
  }

  enable() {
    if (this.config.mode === "time") {
      this.startTimeBasedSwitching();
    } else if (this.config.mode === "system") {
      this.startSystemBasedSwitching();
    }

    this.config.enabled = true;
    this.saveConfig();
  }

  disable() {
    this.stopTimeBasedSwitching();
    this.stopSystemBasedSwitching();

    this.config.enabled = false;
    this.saveConfig();
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  onConfigurationChanged() {
    this.config = this.loadConfig();

    if (this.config.enabled) {
      this.disable();
      this.enable();
    }
  }

  async setupAutoSwitch() {
    const themes = await this.themeManager.getSavedThemes();

    if (themes.length === 0) {
      vscode.window.showInformationMessage("No saved themes found. Create some themes first.");
      return;
    }

    // Let user select light theme
    const lightThemeItems = themes.map((theme) => ({
      label: theme.name,
      description: theme.description || "",
      theme: theme,
    }));

    const lightTheme = await vscode.window.showQuickPick(lightThemeItems, {
      placeHolder: "Select a light theme",
    });

    if (!lightTheme) {
      return;
    }

    // Let user select dark theme
    const darkThemeItems = themes
      .filter((t) => t.name !== lightTheme.theme.name)
      .map((theme) => ({
        label: theme.name,
        description: theme.description || "",
        theme: theme,
      }));

    const darkTheme = await vscode.window.showQuickPick(darkThemeItems, {
      placeHolder: "Select a dark theme",
    });

    if (!darkTheme) {
      return;
    }

    // Choose switching mode
    const mode = await vscode.window.showQuickPick(
      [
        { label: "System Theme", description: "Switch based on system dark/light mode", value: "system" },
        { label: "Time Based", description: "Switch based on time of day", value: "time" },
      ],
      {
        placeHolder: "Choose switching mode",
      }
    );

    if (!mode) {
      return;
    }

    // Configure time-based switching if selected
    let lightHour = 6;
    let darkHour = 18;

    if (mode.value === "time") {
      const lightHourInput = await vscode.window.showInputBox({
        prompt: "Enter hour to switch to light theme (0-23)",
        value: "6",
        validateInput: (value) => {
          const hour = parseInt(value);
          if (isNaN(hour) || hour < 0 || hour > 23) {
            return "Please enter a valid hour (0-23)";
          }
          return null;
        },
      });

      if (lightHourInput) {
        lightHour = parseInt(lightHourInput);
      }

      const darkHourInput = await vscode.window.showInputBox({
        prompt: "Enter hour to switch to dark theme (0-23)",
        value: "18",
        validateInput: (value) => {
          const hour = parseInt(value);
          if (isNaN(hour) || hour < 0 || hour > 23) {
            return "Please enter a valid hour (0-23)";
          }
          return null;
        },
      });

      if (darkHourInput) {
        darkHour = parseInt(darkHourInput);
      }
    }

    // Save configuration
    const config = vscode.workspace.getConfiguration("termistyle");
    await config.update("autoSwitch.enabled", true, vscode.ConfigurationTarget.Global);
    await config.update("autoSwitch.mode", mode.value, vscode.ConfigurationTarget.Global);
    await config.update("autoSwitch.lightTheme", lightTheme.theme.name, vscode.ConfigurationTarget.Global);
    await config.update("autoSwitch.darkTheme", darkTheme.theme.name, vscode.ConfigurationTarget.Global);
    await config.update("autoSwitch.lightHour", lightHour, vscode.ConfigurationTarget.Global);
    await config.update("autoSwitch.darkHour", darkHour, vscode.ConfigurationTarget.Global);

    this.config = this.loadConfig();
    this.enable();

    vscode.window.showInformationMessage("Auto-switching configured successfully!");
  }

  async checkThemeAvailability(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration("termistyle");
    const lightTheme = config.get("autoSwitch.lightTheme", "");
    const darkTheme = config.get("autoSwitch.darkTheme", "");

    if (!lightTheme || !darkTheme) {
      return false;
    }

    const themes = await this.themeManager.getSavedThemes();
    const hasLight = themes.some((t) => t.name === lightTheme);
    const hasDark = themes.some((t) => t.name === darkTheme);

    return hasLight && hasDark;
  }

  checkSystemTheme() {
    if (this.config.enabled && this.config.mode === "system") {
      this.applySystemTheme();
    }
  }

  private startTimeBasedSwitching() {
    this.stopTimeBasedSwitching();

    // Check immediately
    this.applyTimeBasedTheme();

    // Check every minute
    this.timer = setInterval(() => {
      this.applyTimeBasedTheme();
    }, 60000);
  }

  private stopTimeBasedSwitching() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private startSystemBasedSwitching() {
    this.stopSystemBasedSwitching();

    // Apply immediately
    this.applySystemTheme();

    // VS Code doesn't have a direct API for system theme changes,
    // but we can watch for configuration changes and window focus
    this.systemThemeWatcher = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("workbench.colorTheme")) {
        this.applySystemTheme();
      }
    });
  }

  private stopSystemBasedSwitching() {
    if (this.systemThemeWatcher) {
      this.systemThemeWatcher.dispose();
      this.systemThemeWatcher = undefined;
    }
  }

  private async applyTimeBasedTheme() {
    const now = new Date();
    const currentHour = now.getHours();

    const shouldUseLightTheme = currentHour >= this.config.lightHour && currentHour < this.config.darkHour;
    const themeName = shouldUseLightTheme ? this.config.lightTheme : this.config.darkTheme;

    await this.applyThemeByName(themeName);
  }

  private async applySystemTheme() {
    // Detect system theme by checking current VS Code theme
    const config = vscode.workspace.getConfiguration();
    const currentTheme = config.get("workbench.colorTheme", "") as string;

    // Simple heuristic: if current theme contains 'light' or 'dark', use that
    const isLightTheme = currentTheme.toLowerCase().includes("light") || currentTheme.toLowerCase().includes("day");

    const themeName = isLightTheme ? this.config.lightTheme : this.config.darkTheme;

    await this.applyThemeByName(themeName);
  }

  private async applyThemeByName(themeName: string) {
    if (!themeName) {
      return;
    }

    const themes = await this.themeManager.getSavedThemes();
    const theme = themes.find((t) => t.name === themeName);

    if (theme) {
      await this.themeManager.applyTheme(theme);
    }
  }

  private loadConfig(): AutoSwitchConfig {
    const config = vscode.workspace.getConfiguration("termistyle");

    return {
      enabled: config.get("autoSwitch.enabled", false),
      mode: config.get("autoSwitch.mode", "system"),
      lightTheme: config.get("autoSwitch.lightTheme", ""),
      darkTheme: config.get("autoSwitch.darkTheme", ""),
      lightHour: config.get("autoSwitch.lightHour", 6),
      darkHour: config.get("autoSwitch.darkHour", 18),
    };
  }

  private saveConfig() {
    const config = vscode.workspace.getConfiguration("termistyle");
    config.update("autoSwitch.enabled", this.config.enabled, vscode.ConfigurationTarget.Global);
  }

  dispose() {
    this.disable();
  }
}
