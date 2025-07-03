import * as vscode from "vscode";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { ThemeManager } from "./ThemeManager";

let themeCustomizer: ThemeCustomizer | undefined;
let themeManager: ThemeManager;

export function activate(context: vscode.ExtensionContext) {
  console.log("VibeStudio extension is now active!");

  // Initialize managers
  themeManager = new ThemeManager(context);

  // Register commands
  registerCommands(context);

  // Show welcome message on first install
  showWelcomeMessage(context);
}

function registerCommands(context: vscode.ExtensionContext) {
  // Open Theme Customizer
  const openCustomizer = vscode.commands.registerCommand("vibestudio.openCustomizer", () => {
    try {
      if (ThemeCustomizer.currentPanel) {
        ThemeCustomizer.currentPanel.show();
      } else {
        themeCustomizer = new ThemeCustomizer(context, themeManager);
      }
    } catch (error) {
      console.error("Error opening theme customizer:", error);
      vscode.window.showErrorMessage(`Failed to open theme customizer: ${error}`);
    }
  });

  // Register command
  context.subscriptions.push(openCustomizer);
}

async function showWelcomeMessage(context: vscode.ExtensionContext) {
  const hasShownWelcome = context.globalState.get<boolean>("vibestudio.hasShownWelcome", false);

  if (!hasShownWelcome) {
    const action = await vscode.window.showInformationMessage(
      "🎨 Welcome to VibeStudio! Customize your entire VS Code theme with live preview.",
      "Open Theme Customizer",
      "Not Now"
    );

    if (action === "Open Theme Customizer") {
      vscode.commands.executeCommand("vibestudio.openCustomizer");
    }

    await context.globalState.update("vibestudio.hasShownWelcome", true);
  }
}

export function deactivate() {
  if (themeCustomizer) {
    themeCustomizer.dispose();
  }
}
