import * as vscode from "vscode";
import * as path from "path";
import { ThemeManager } from "./ThemeManager";
import { TerminalTheme, WebviewMessage, ThemePreset } from "./types";
import { PresetManager } from "./PresetManager";

export class ThemeCustomizer {
  public static currentPanel: ThemeCustomizer | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private themeManager: ThemeManager;
  private presetManager: PresetManager;
  private currentTheme: TerminalTheme | null = null;

  constructor(context: vscode.ExtensionContext, themeManager: ThemeManager) {
    try {
      this.extensionUri = context.extensionUri;
      this.themeManager = themeManager;
      this.presetManager = new PresetManager();

      // Create and show a new webview panel
      this.panel = vscode.window.createWebviewPanel("vibestudioCustomizer", "VibeStudio Theme Customizer", vscode.ViewColumn.One, {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "resources")],
      });

      // Set the webview's initial html content
      this.panel.webview.html = this.getHtmlForWebview();

      // Listen for when the panel is disposed
      this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

      // Handle messages from the webview
      this.panel.webview.onDidReceiveMessage(
        (message: WebviewMessage) => {
          this.handleMessage(message).catch((error) => {
            console.error("Error handling webview message:", error);
          });
        },
        undefined,
        this.disposables
      );

      // Handle webview visibility changes
      this.panel.onDidChangeViewState(
        () => {
          if (this.panel.visible) {
            // Re-initialize with current theme when panel becomes visible
            this.initializeWithCurrentTheme().catch((error) => {
              console.error("Error re-initializing theme on visibility change:", error);
            });
          }
        },
        null,
        this.disposables
      );

      // Initialize with current theme
      this.initializeWithCurrentTheme().catch((error) => {
        console.error("Error initializing theme:", error);
      });

      ThemeCustomizer.currentPanel = this;
    } catch (error) {
      console.error("Error creating ThemeCustomizer:", error);
      throw error;
    }
  }

  public show() {
    try {
      if (this.panel) {
        this.panel.reveal(vscode.ViewColumn.One);
      }
    } catch (error) {
      console.error("Error showing theme customizer:", error);
      throw error;
    }
  }

  public dispose() {
    ThemeCustomizer.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private async initializeWithCurrentTheme() {
    this.currentTheme = await this.themeManager.getCurrentTheme();

    // Send current theme data to webview
    if (this.currentTheme) {
      this.sendMessageToWebview({
        type: "themeUpdate",
        data: this.currentTheme,
      });
    }

    // Also send presets to ensure dropdown is populated
    const presets = this.presetManager.getPresets();
    this.sendMessageToWebview({
      type: "presets",
      data: presets,
    });
  }

  private async handleMessage(message: WebviewMessage) {
    switch (message.type) {
      case "themeUpdate":
        if (message.data) {
          this.currentTheme = message.data as TerminalTheme;
          // Only update the preview, don't apply to terminal
        }
        break;

      case "applyTheme":
        if (message.data) {
          const theme = message.data as TerminalTheme;
          this.currentTheme = theme; // Update current theme
          await this.themeManager.applyTheme(theme);
          vscode.window.showInformationMessage("Theme applied successfully!");
        } else if (this.currentTheme) {
          // Fallback to existing theme if no data provided
          await this.themeManager.applyTheme(this.currentTheme);
          vscode.window.showInformationMessage("Theme applied successfully!");
        } else {
          vscode.window.showErrorMessage("No theme data available to apply.");
        }
        break;

      case "getPresets":
        const presets = this.presetManager.getPresets();
        this.sendMessageToWebview({
          type: "presets",
          data: presets,
        });
        break;

      case "getSystemFonts":
        const fonts = await this.themeManager.getSystemFonts();
        this.sendMessageToWebview({
          type: "systemFonts",
          data: fonts,
        });
        break;

      case "resetTheme":
        // Reset to default by removing color customizations
        await this.themeManager.resetToDefaultColors();

        // Refresh the current theme in the UI to reflect the reset
        this.currentTheme = await this.themeManager.getCurrentTheme();
        this.sendMessageToWebview({
          type: "themeUpdate",
          data: this.currentTheme,
        });
        break;
    }
  }

  private sendMessageToWebview(message: any) {
    try {
      if (this.panel && this.panel.webview) {
        this.panel.webview.postMessage(message);
      }
    } catch (error) {
      console.error("Error sending message to webview:", error);
    }
  }

  private getHtmlForWebview(): string {
    // Use a nonce to only allow specific scripts to be run
    const nonce = this.getNonce();

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TermiStyle Theme Customizer</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 0;
                        margin: 0;
                        color: var(--vscode-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding-top: 80px; /* Add top padding for sticky header */
                    }
                    .header {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 1000;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px 20px;
                        background: var(--vscode-editor-background);
                        border-bottom: 2px solid var(--vscode-widget-border);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(10px);
                    }
                    .title {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 0;
                    }
                    .header-actions {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 13px;
                    }
                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .btn-secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }
                    .btn-apply {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        font-weight: bold;
                        font-size: 14px;
                        padding: 10px 20px;
                    }
                    .main-content {
                        display: flex;
                        flex-direction: column;
                        max-width: 800px;
                        margin: 0 auto;
                        gap: 20px;
                        min-height: 80vh;
                    }

                    .terminal-preview {
                        background: #000000;
                        color: #ffffff;
                        font-family: 'Consolas', monospace;
                        font-size: 14px;
                        padding: 15px;
                        border-radius: 5px;
                        min-height: 300px;
                        position: relative;
                        overflow: hidden;
                    }
                    .terminal-line {
                        margin-bottom: 8px;
                        line-height: 1.2;
                    }
                    .prompt {
                        color: #00ff00;
                        font-weight: bold;
                    }
                    .command {
                        color: #ffffff;
                    }
                    .output {
                        color: #cccccc;
                    }
                    .error {
                        color: #ff6b6b;
                    }
                    .success {
                        color: #4ecdc4;
                    }
                    .warning {
                        color: #ffe66d;
                    }
                    .selection {
                        background-color: rgba(255, 255, 255, 0.3);
                        padding: 0 2px;
                    }
                    .cursor {
                        background: #ffffff;
                        color: #000000;
                        animation: blink 1s infinite;
                        padding: 0 1px;
                    }
                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }
                    .color-demo {
                        margin-top: 15px;
                        padding: 10px;
                        border: 1px solid #333;
                        border-radius: 3px;
                    }
                    .color-demo-title {
                        color: #888;
                        font-size: 12px;
                        margin-bottom: 8px;
                    }
                    .control-panels {
                        display: flex;
                        flex-direction: column;
                        gap: 20px;
                    }
                    .panel {
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 5px;
                        padding: 15px;
                    }
                    .panel h3 {
                        margin-top: 0;
                        color: var(--vscode-textLink-foreground);
                    }
                    .form-group {
                        margin-bottom: 15px;
                    }
                    .form-group label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    .form-group input,
                    .form-group select {
                        width: 100%;
                        padding: 6px;
                        border: 1px solid var(--vscode-input-border);
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border-radius: 3px;
                    }
                    .form-row {
                        display: flex;
                        gap: 10px;
                        align-items: end;
                    }
                    .form-row .form-group {
                        flex: 1;
                    }
                    .color-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                    }
                    .color-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .color-item label {
                        flex: 1;
                        font-size: 12px;
                    }
                    .color-item input[type="color"] {
                        width: 40px;
                        height: 30px;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                    }
                    .color-item input[type="range"] {
                        width: 100px;
                        height: 6px;
                        border-radius: 3px;
                        background: var(--vscode-scrollbarSlider-background);
                        outline: none;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                        cursor: pointer;
                    }
                    .color-item input[type="range"]:hover {
                        opacity: 1;
                    }
                    .color-item input[type="range"]::-webkit-slider-thumb {
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        background: var(--vscode-textLink-foreground);
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .color-item input[type="range"]::-webkit-slider-thumb:hover {
                        transform: scale(1.2);
                        background: var(--vscode-textLink-activeForeground);
                    }
                    .color-item span {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        min-width: 30px;
                        text-align: right;
                    }
                    .theme-section {
                        margin-bottom: 20px;
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 4px;
                        padding: 15px;
                        background: var(--vscode-editor-background);
                    }
                    .theme-section h4 {
                        margin-top: 0;
                        margin-bottom: 15px;
                        color: var(--vscode-textLink-foreground);
                        border-bottom: 1px solid var(--vscode-widget-border);
                        padding-bottom: 8px;
                        font-size: 14px;
                        font-weight: 600;
                    }
                    .theme-section .color-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 12px;
                    }
                    .theme-section .color-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 4px;
                    }
                    .theme-section .color-item label {
                        flex: 1;
                        font-size: 12px;
                        margin-bottom: 0;
                        font-weight: normal;
                    }
                    #editorThemeControls {
                        margin-top: 15px;
                        max-height: 600px;
                        overflow-y: auto;
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 4px;
                        padding: 10px;
                    }
                    #editorThemeControls.collapsed {
                        display: none;
                    }
                    .form-group input[type="checkbox"] {
                        width: auto;
                        margin-right: 8px;
                    }
                    
                    /* VS Code Mockup Styles */
                    .vscode-mockup {
                        border: 1px solid #333;
                        border-radius: 5px;
                        overflow: hidden;
                        background: #1e1e1e;
                        font-size: 11px;
                        min-height: 200px;
                    }
                    .mockup-titlebar {
                        background: #3c3c3c;
                        color: #cccccc;
                        padding: 8px 12px;
                        font-size: 12px;
                        border-bottom: 1px solid #2d2d30;
                    }
                    .mockup-body {
                        display: flex;
                        height: 140px;
                    }
                    .mockup-activitybar {
                        background: #333333;
                        width: 48px;
                        min-height: 200px;
                        position: relative;
                        border-right: 1px solid #2d2d30;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 8px 0;
                        margin: 0 auto;
                        box-shadow: 2px 0 5px rgba(0,0,0,0.2);
                    }
                    
                    .activity-icon {
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 4px 0;
                        cursor: pointer;
                        border-radius: 4px;
                        font-size: 16px;
                        position: relative;
                        transition: all 0.2s ease;
                        background: transparent;
                    }
                    
                    .activity-icon.active {
                        font-weight: bold;
                        transform: scale(1.1);
                    }
                    
                    .activity-border {
                        position: absolute;
                        left: 0;
                        top: 50px; /* Align with first active icon */
                        width: 3px;
                        height: 32px;
                        background: #007acc;
                        border-radius: 0 2px 2px 0;
                        z-index: 10;
                        box-shadow: 2px 0 4px rgba(0,0,0,0.3);
                    }
                    
                    /* Activity Bar Section Preview Container */
                    .activitybar-section-preview {
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 5px;
                        padding: 15px;
                        display: flex;
                        justify-content: center;
                        min-height: 250px;
                        align-items: flex-start;
                    }
                    
                    .mockup-sidebar {
                        background: #252526;
                        width: 120px;
                        padding: 8px;
                        border-right: 1px solid #2d2d30;
                        overflow: hidden;
                    }
                    .sidebar-title {
                        color: #cccccc;
                        font-size: 10px;
                        font-weight: bold;
                        margin-bottom: 8px;
                        letter-spacing: 0.5px;
                    }
                    .file-tree {
                        font-size: 11px;
                    }
                    .file-item {
                        color: #cccccc;
                        padding: 2px 4px;
                        cursor: pointer;
                        border-radius: 2px;
                    }
                    .file-item.active {
                        background: #264f78;
                    }
                    .mockup-editor {
                        flex: 1;
                        background: #1e1e1e;
                        display: flex;
                        flex-direction: column;
                    }
                    .editor-tabs {
                        background: #2d2d30;
                        display: flex;
                        border-bottom: 1px solid #252526;
                    }
                    .tab {
                        padding: 6px 12px;
                        font-size: 11px;
                        cursor: pointer;
                        border-right: 1px solid #252526;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .tab.active {
                        background: #1e1e1e;
                        color: #ffffff;
                        border-top: 2px solid #007acc;
                        padding-top: 4px;
                    }
                    .tab.inactive {
                        background: #2d2d30;
                        color: #cccccc80;
                    }
                    .tab-close {
                        opacity: 0.6;
                        font-size: 14px;
                        line-height: 1;
                    }
                    .editor-content {
                        flex: 1;
                        padding: 8px;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        font-family: 'Consolas', monospace;
                    }
                    .code-line {
                        display: flex;
                        align-items: center;
                        margin-bottom: 2px;
                        min-height: 16px;
                    }
                    .code-line.highlighted {
                        background: #2a2d2e;
                        margin: 0 -8px;
                        padding: 0 8px;
                    }
                    .line-number {
                        color: #858585;
                        width: 25px;
                        text-align: right;
                        margin-right: 12px;
                        font-size: 10px;
                    }
                    .code-comment { color: #6a9955; }
                    .code-keyword { color: #569cd6; }
                    .code-string { color: #ce9178; }
                    .code-number { color: #b5cea8; }
                    .code-function { color: #dcdcaa; }
                    .code-variable { color: #9cdcfe; }
                    .code-type { color: #4ec9b0; }
                    .code-operator { color: #d4d4d4; }
                    .code-punctuation { color: #d4d4d4; }
                    .editor-cursor {
                        background: #ffffff;
                        color: #000000;
                        animation: blink 1s infinite;
                        width: 2px;
                        height: 14px;
                    }
                    .mockup-statusbar {
                        background: #007acc;
                        color: #ffffff;
                        padding: 4px 12px;
                        font-size: 11px;
                        display: flex;
                        justify-content: space-between;
                        border-top: 1px solid #2d2d30;
                    }
                    .status-right {
                        opacity: 0.8;
                    }
                    
                    /* Enhanced Control Panel Styles */
                    .main-panel {
                        border: 2px solid var(--vscode-textLink-foreground);
                    }
                    .section-description {
                        color: var(--vscode-descriptionForeground);
                        font-size: 12px;
                        margin-bottom: 15px;
                        font-style: italic;
                    }
                    .subsection {
                        margin-bottom: 20px;
                    }
                    .subsection h5 {
                        margin: 0 0 8px 0;
                        color: var(--vscode-textLink-foreground);
                        font-size: 13px;
                        font-weight: 600;
                    }
                    
                    /* Comprehensive Interactive Preview Styles */
                    .interactive-preview {
                        margin-top: 20px;
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-widget-border);
                        border-radius: 5px;
                        padding: 15px;
                    }
                    .ui-elements {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    .ui-group {
                        margin-bottom: 15px;
                    }
                    .ui-group h5 {
                        margin: 0 0 8px 0;
                        color: var(--vscode-textLink-foreground);
                        font-size: 12px;
                        font-weight: 600;
                    }
                    
                    /* Sidebar Preview */
                    .file-item {
                        padding: 4px 8px;
                        margin: 1px 0;
                        cursor: pointer;
                        border-radius: 3px;
                        transition: all 0.2s;
                    }
                    .file-item.hover-item {
                        background: #2a2d2e !important;
                    }
                    .file-item.focus-item {
                        background: #094771 !important;
                        color: #ffffff !important;
                    }
                    
                    /* Tab Preview */
                    .tab {
                        position: relative;
                    }
                    .tab-border-top {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: #007acc;
                    }
                    .tab.hover-tab {
                        background: #1e1e1e !important;
                        opacity: 0.8;
                    }
                    
                    /* Editor Elements */
                    .selection {
                        background: #264f78 !important;
                        color: #ffffff !important;
                        padding: 0 2px;
                        border-radius: 2px;
                    }
                    .indent-guide {
                        position: absolute;
                        left: 50px;
                        top: 20px;
                        width: 1px;
                        height: 80px;
                        background: #404040;
                        opacity: 0.6;
                    }
                    
                    /* Button Previews */
                    .preview-button {
                        padding: 6px 12px;
                        margin: 4px;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s;
                    }
                    .preview-button.primary {
                        background: #0e639c;
                        color: #ffffff;
                    }
                    .preview-button.secondary {
                        background: #5f6a79;
                        color: #ffffff;
                    }
                    .preview-button.hover {
                        background: #1177bb;
                        color: #ffffff;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    }
                    
                    /* Input Previews */
                    .preview-input {
                        background: #3c3c3c;
                        color: #cccccc;
                        border: 1px solid #3c3c3c;
                        padding: 6px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        width: 120px;
                        margin: 4px;
                    }
                    .preview-input::placeholder {
                        color: #cccccc80;
                    }
                    .preview-dropdown {
                        background: #3c3c3c;
                        color: #cccccc;
                        border: 1px solid #3c3c3c;
                        padding: 6px 8px;
                        border-radius: 3px;
                        font-size: 12px;
                        margin: 4px;
                    }
                    .preview-checkbox {
                        display: flex;
                        align-items: center;
                        color: #cccccc;
                        font-size: 12px;
                        margin: 4px;
                    }
                    .preview-checkbox input {
                        background: #3c3c3c;
                        border: 1px solid #454545;
                        margin-right: 6px;
                    }
                    
                    /* List Previews */
                    .preview-list {
                        background: #252526;
                        border: 1px solid #2d2d30;
                        border-radius: 3px;
                        padding: 4px;
                        font-size: 12px;
                    }
                    .list-item {
                        padding: 4px 8px;
                        margin: 1px 0;
                        border-radius: 2px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .list-item.active {
                        background: #094771;
                        color: #ffffff;
                    }
                    .list-item.inactive {
                        background: #37373d;
                        color: #cccccc;
                    }
                    .list-item.hover {
                        background: #2a2d2e;
                        color: #ffffff;
                    }
                    .list-item.focus {
                        background: #094771;
                        color: #ffffff;
                        outline: 1px solid #007acc;
                    }
                    
                    /* Progress & Badge Previews */
                    .preview-progress {
                        background: #2d2d30;
                        height: 4px;
                        border-radius: 2px;
                        margin: 8px 4px;
                        overflow: hidden;
                    }
                    .progress-bar {
                        background: #007acc;
                        height: 100%;
                        width: 60%;
                        border-radius: 2px;
                        transition: all 0.3s;
                    }
                    .preview-badge {
                        background: #007acc;
                        color: #ffffff;
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 10px;
                        font-weight: bold;
                        display: inline-block;
                        margin: 4px;
                    }
                    
                    /* Quick Info Styling */
                    .quick-info {
                        margin-bottom: 20px;
                    }
                    
                    .info-card {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                    }
                    
                    .info-card h2 {
                        color: var(--vscode-foreground);
                        margin: 0 0 10px 0;
                    }
                    
                    .info-card p {
                        color: var(--vscode-descriptionForeground);
                        margin: 5px 0;
                    }
                    
                    /* Section Preview Styling */
                    .section-preview {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 6px;
                        padding: 15px;
                        margin: 15px 0;
                    }
                    
                    .section-preview h5 {
                        color: var(--vscode-foreground);
                        margin: 0 0 10px 0;
                        font-size: 14px;
                        font-weight: 600;
                    }
                    
                    /* Terminal Section Preview */
                    .terminal-preview {
                        background: #000000;
                        color: #ffffff;
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 13px;
                        padding: 12px;
                        border-radius: 4px;
                        line-height: 1.4;
                        min-height: 120px;
                    }
                    
                    /* Editor Section Preview */
                    .editor-section-preview {
                        background: #1e1e1e;
                        color: #d4d4d4;
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 13px;
                        border-radius: 4px;
                        padding: 10px;
                        min-height: 100px;
                    }
                    
                    /* Sidebar Section Preview */
                    .sidebar-section-preview {
                        background: #f0f0f0;
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .sidebar-section-preview .mockup-sidebar {
                        width: 100%;
                        min-height: 120px;
                    }
                    
                    /* Status Bar Section Preview */
                    .statusbar-section-preview {
                        background: #f0f0f0;
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .statusbar-section-preview .mockup-statusbar {
                        width: 100%;
                        margin-bottom: 5px;
                        min-height: 22px;
                    }
                    
                    .statusbar-section-preview .mockup-statusbar.debug {
                        background: #cc6633 !important;
                    }
                    
                    /* Tabs Section Preview */
                    .tabs-section-preview {
                        background: #f0f0f0;
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .tabs-section-preview .editor-tabs {
                        width: 100%;
                        min-height: 35px;
                    }
                    
                    /* Syntax Section Preview */
                    .syntax-section-preview {
                        background: #1e1e1e;
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .syntax-section-preview .syntax-code {
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 13px;
                        line-height: 1.4;
                        color: #d4d4d4;
                    }
                    
                    /* UI Controls Section Preview */
                    .ui-controls-section-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 15px;
                    }
                    
                    .ui-controls-section-preview .ui-elements {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    
                    .ui-controls-section-preview .ui-group {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .ui-controls-section-preview .ui-group h6 {
                        color: var(--vscode-foreground);
                        margin: 0;
                        font-size: 12px;
                        font-weight: 600;
                    }
                    
                    .ui-controls-section-preview .preview-button,
                    .ui-controls-section-preview .preview-input,
                    .ui-controls-section-preview .preview-dropdown {
                        font-size: 12px;
                        padding: 4px 8px;
                        margin: 2px;
                        border-radius: 3px;
                        border: 1px solid var(--vscode-input-border);
                    }
                    
                    .ui-controls-section-preview .preview-list {
                        font-size: 12px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 3px;
                        overflow: hidden;
                    }
                    
                    .ui-controls-section-preview .list-item {
                        padding: 4px 8px;
                        cursor: pointer;
                        border-bottom: 1px solid var(--vscode-input-border);
                    }
                    
                    .ui-controls-section-preview .list-item:last-child {
                        border-bottom: none;
                    }
                    
                    .ui-controls-section-preview .preview-progress {
                        height: 4px;
                        background: var(--vscode-input-background);
                        border-radius: 2px;
                        overflow: hidden;
                        margin: 4px 0;
                    }
                    
                    .ui-controls-section-preview .progress-bar {
                        height: 100%;
                        width: 60%;
                        background: #007acc;
                        border-radius: 2px;
                    }
                    
                    .ui-controls-section-preview .preview-badge {
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 10px;
                        background: #007acc;
                        color: white;
                        display: inline-block;
                    }
                    
                    /* Title Bar Section Preview */
                    .titlebar-section-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .mockup-titlebar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px 12px;
                        border-radius: 3px;
                        margin-bottom: 5px;
                        font-size: 12px;
                        min-height: 20px;
                    }
                    
                    .mockup-titlebar.active {
                        background: #3c3c3c;
                        color: #cccccc;
                    }
                    
                    .mockup-titlebar.inactive {
                        background: #3c3c3c;
                        color: #cccccc;
                        opacity: 0.7;
                    }
                    
                    .titlebar-text {
                        flex: 1;
                        font-weight: 500;
                    }
                    
                    .titlebar-controls {
                        font-size: 10px;
                        color: #999;
                    }
                    
                    /* List & Tree Section Preview */
                    .list-tree-section-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .tree-container {
                        background: #252526;
                        border: 1px solid #2d2d30;
                        border-radius: 3px;
                        overflow: hidden;
                        min-height: 120px;
                    }
                    
                    .tree-header {
                        background: #2d2d30;
                        color: #cccccc;
                        padding: 6px 12px;
                        font-size: 11px;
                        font-weight: bold;
                        border-bottom: 1px solid #2d2d30;
                    }
                    
                    .tree-content {
                        padding: 4px 0;
                        background: #252526;
                    }
                    
                    .tree-item {
                        padding: 4px 12px;
                        font-size: 12px;
                        color: #cccccc;
                        cursor: pointer;
                        border-left: 3px solid transparent;
                    }
                    
                    .tree-item.active-selection {
                        background: #094771;
                        color: #ffffff;
                        border-left: 3px solid #007acc;
                    }
                    
                    .tree-item.inactive-selection {
                        background: #37373d;
                        color: #cccccc;
                    }
                    
                    .tree-item.hover-item {
                        background: #2a2d2e;
                        color: #ffffff;
                    }
                    
                    .tree-item.focus-item {
                        background: #094771;
                        color: #ffffff;
                        outline: 1px solid #007acc;
                    }
                    
                    .tree-item.normal-item {
                        background: transparent;
                        color: #cccccc;
                    }
                    
                    /* Sidebar Section Headers Preview */
                    .sidebar-headers-section-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .mockup-sidebar-headers {
                        background: #252526;
                        border: 1px solid #2d2d30;
                        border-radius: 3px;
                        overflow: hidden;
                        min-height: 120px;
                    }
                    
                    .section-header {
                        background: #252526;
                        color: #cccccc;
                        padding: 8px 12px;
                        font-size: 11px;
                        font-weight: bold;
                        text-transform: uppercase;
                        border-bottom: 1px solid #2d2d30;
                        cursor: pointer;
                    }
                    
                    .section-content {
                        padding: 8px 0;
                    }
                    
                    .outline-item, .timeline-item {
                        padding: 4px 20px;
                        font-size: 12px;
                        color: #cccccc;
                        cursor: pointer;
                        border-bottom: none;
                    }
                    
                    .outline-item:hover, .timeline-item:hover {
                        background: #2a2d2e;
                    }

                    /* Additional styles for new preview elements */
                    .terminal-foreground {
                        color: inherit;
                    }
                    
                    .terminal-selection {
                        background-color: rgba(255, 255, 255, 0.3);
                        padding: 0 2px;
                        border-radius: 2px;
                    }
                    
                    .editor-foreground-example {
                        color: inherit;
                        font-style: italic;
                    }
                    
                    .editor-selection {
                        background-color: rgba(100, 175, 255, 0.3);
                        padding: 0 2px;
                        border-radius: 2px;
                    }
                    
                    .indent-guide-visual {
                        display: inline-block;
                        width: 12px;
                        text-align: center;
                        color: #404040;
                        margin-right: 4px;
                    }
                    
                    .sidebar-border-example {
                        margin-top: 10px;
                        padding: 5px;
                        text-align: center;
                        font-size: 11px;
                        border-top: 2px solid #2d2d30;
                    }
                    
                    .activity-icon {
                        display: block;
                        padding: 8px;
                        margin: 2px 0;
                        text-align: center;
                        border-radius: 2px;
                        cursor: pointer;
                    }
                    
                    .activity-icon.active {
                        position: relative;
                    }
                    
                    .activity-border {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 2px;
                        height: 30px;
                        background: #007acc;
                    }
                    
                    /* Panel Tabs Section Preview */
                    .panel-tabs-section-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 10px;
                    }
                    
                    .mockup-panel-tabs {
                        display: flex;
                        background: #252526;
                        border: 1px solid #2d2d30;
                        border-radius: 3px;
                        overflow: hidden;
                        min-height: 35px;
                    }
                    
                    .panel-tab {
                        padding: 8px 16px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        cursor: pointer;
                        position: relative;
                        border-right: 1px solid #2d2d30;
                        transition: all 0.2s ease;
                    }
                    
                    .panel-tab:last-child {
                        border-right: none;
                    }
                    
                    .panel-tab.active {
                        color: #ffffff;
                        background: rgba(255, 255, 255, 0.05);
                    }
                    
                    .panel-tab.inactive {
                        color: #cccccc80;
                        background: transparent;
                    }
                    
                    .panel-tab.active .panel-tab-border {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: #007acc;
                    }
                    
                    .panel-tab:hover.inactive {
                        color: #cccccc;
                        background: rgba(255, 255, 255, 0.02);
                    }

                    /* Scrollbar, Breadcrumb, Gutter & Minimap Section Preview */
                    .scrollbar-elements-preview {
                        background: var(--vscode-editor-background);
                        border-radius: 4px;
                        padding: 15px;
                    }

                    .preview-editor-area {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    /* Breadcrumb preview */
                    .breadcrumb-preview {
                        background: #1e1e1e;
                        padding: 8px 12px;
                        border-radius: 3px;
                        font-size: 12px;
                        border-bottom: 1px solid #2d2d30;
                    }

                    .breadcrumb-segment {
                        color: #888;
                        padding: 2px 4px;
                    }

                    .breadcrumb-segment.active {
                        color: #fff;
                        font-weight: 500;
                    }

                    .breadcrumb-separator {
                        color: #555;
                        margin: 0 4px;
                    }

                    /* Editor with gutter */
                    .editor-with-gutter {
                        display: flex;
                        background: #1e1e1e;
                        border-radius: 3px;
                        overflow: hidden;
                        position: relative;
                    }

                    .gutter-preview {
                        background: #1e1e1e;
                        padding: 8px;
                        border-right: 1px solid #2d2d30;
                        min-width: 40px;
                        text-align: right;
                    }

                    .gutter-preview .line-number {
                        color: #858585;
                        font-size: 11px;
                        line-height: 1.6;
                        font-family: 'Consolas', monospace;
                    }

                    .editor-content {
                        flex: 1;
                        padding: 8px;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        font-family: 'Consolas', monospace;
                        font-size: 12px;
                    }

                    .editor-content .code-line {
                        line-height: 1.6;
                        white-space: pre;
                    }

                    /* Minimap */
                    .minimap-container {
                        position: absolute;
                        right: 0;
                        top: 0;
                        bottom: 0;
                        width: 80px;
                    }

                    .minimap-preview {
                        background: #1e1e1e;
                        height: 100%;
                        border-left: 1px solid #2d2d30;
                        position: relative;
                        padding: 4px;
                    }

                    .minimap-content {
                        height: 100%;
                    }

                    .minimap-line {
                        height: 2px;
                        background: #333;
                        margin: 1px 0;
                        border-radius: 1px;
                    }

                    .minimap-line.active {
                        background: #007acc;
                    }

                    .minimap-slider {
                        position: absolute;
                        left: 2px;
                        right: 2px;
                        height: 20px;
                        background: rgba(100, 100, 100, 0.3);
                        border-radius: 2px;
                        top: 20px;
                    }

                    /* Scrollbar preview */
                    .scrollbar-container {
                        margin-top: 10px;
                        padding: 10px;
                        background: #f0f0f0;
                        border-radius: 4px;
                    }

                    .scrollbar-preview {
                        width: 100%;
                        height: 40px;
                        background: #2d2d30;
                        border-radius: 3px;
                        position: relative;
                        padding: 4px;
                    }

                    .scrollbar-track {
                        height: 100%;
                        background: #1e1e1e;
                        border-radius: 2px;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: space-around;
                    }

                    .scrollbar-slider {
                        width: 60px;
                        height: 12px;
                        border-radius: 6px;
                        position: relative;
                    }

                    .scrollbar-slider.normal {
                        background: rgba(121, 121, 121, 0.4);
                    }

                    .scrollbar-slider.hover {
                        background: rgba(100, 100, 100, 0.7);
                    }

                    .scrollbar-slider.active {
                        background: rgba(191, 191, 191, 0.4);
                    }

                    .scrollbar-slider::after {
                        content: attr(class);
                        position: absolute;
                        top: -18px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 9px;
                        color: #888;
                        white-space: nowrap;
                    }

                    .scrollbar-slider.normal::after {
                        content: "Normal";
                    }

                    .scrollbar-slider.hover::after {
                        content: "Hover";
                    }

                    .scrollbar-slider.active::after {
                        content: "Active";
                    }

                </style>
            </head>
            <body>
                <div class="container" id="app">
                    <!-- Header -->
                    <header class="header">
                        <h1 class="title">🎨 VibeStudio</h1>
                        <div class="header-actions">
                            <button class="btn btn-secondary" id="resetBtn">Reset to Default</button>
                            <button class="btn btn-apply" id="applyBtn">Apply Themes</button>
                        </div>
                    </header>

                    <!-- Main Content -->
                    <div class="main-content">
                        <!-- Control Panels -->
                        <div class="control-panels">
                            <!-- Theme Presets -->
                            <div class="panel">
                                <h3>🎨 Theme Presets</h3>
                                <div class="form-group">
                                    <label for="presetSelect">Choose a complete VS Code theme:</label>
                                    <select id="presetSelect">
                                        <option value="">Choose a preset...</option>
                                    </select>
                                </div>
                            </div>

                            <!-- VS Code Theme Customization -->
                            <div class="panel main-panel">
                                <h3>🖥️ VS Code Theme Customization</h3>
                                
                                <!-- Terminal Section -->
                                <div class="theme-section">
                                    <h4>💻 Terminal</h4>
                                    <div class="section-description">Customize your integrated terminal colors and appearance</div>
                                    
                                    <!-- Terminal Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Terminal Preview</h5>
                                        <div class="terminal-preview" id="terminalPreview">
                                            <div class="terminal-line">
                                                <span class="prompt">user@vibestudio:~$ </span>
                                                <span class="command">echo "Welcome to VibeStudio!"</span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="output terminal-foreground">Welcome to VibeStudio!</span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="prompt">user@vibestudio:~$ </span>
                                                <span class="command">ls --color=auto</span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="success">✓ theme.json</span> <span class="warning">⚠ config.bak</span> <span class="error">✗ error.log</span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="prompt">user@vibestudio:~$ </span>
                                                <span class="command">cat <span class="terminal-selection">important.txt</span></span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="terminal-foreground">This text shows foreground color example</span>
                                            </div>
                                            <div class="terminal-line">
                                                <span class="prompt">user@vibestudio:~$ </span>
                                                <span class="cursor">█</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="backgroundColor" value="#000000">
                                            </div>
                                            <div class="color-item">
                                                <label>Foreground:</label>
                                                <input type="color" id="foregroundColor" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Cursor:</label>
                                                <input type="color" id="cursorColor" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Selection:</label>
                                                <input type="color" id="selectionColor" value="#ffffff">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Font</h5>
                                        <div class="form-row">
                                            <div class="form-group">
                                                <label for="fontSize">Font Size:</label>
                                                <input type="number" id="fontSize" min="8" max="32" value="14">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Editor Core Section -->
                                <div class="theme-section">
                                    <h4>📝 Editor Core</h4>
                                    <div class="section-description">Main editor window colors and appearance</div>
                                    
                                    <!-- Editor Core Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Editor Preview</h5>
                                        <div class="editor-section-preview" id="editorSectionPreview">
                                            <div class="editor-content" id="mockupEditorContent">
                                                <div class="code-line">
                                                    <span class="line-number">1</span>
                                                    <span class="indent-guide-visual" id="indentGuideExample">│</span>
                                                    <span class="code-comment">// Editor colors preview</span>
                                                </div>
                                                <div class="code-line highlighted" id="lineHighlighted">
                                                    <span class="line-number">2</span>
                                                    <span class="indent-guide-visual" id="indentGuideActive">│</span>
                                                    <span class="code-keyword">const</span> 
                                                    <span class="code-variable">theme</span> 
                                                    <span class="code-operator">=</span> 
                                                    <span class="code-string editor-selection" id="editorSelectionExample">"awesome"</span><span class="code-punctuation">;</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">3</span>
                                                    <span class="indent-guide-visual">│</span>
                                                    <span class="editor-foreground-example">This shows foreground color</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">4</span>
                                                    <span class="indent-guide-visual">│</span>
                                                    <span class="editor-cursor" id="editorCursorPreview">|</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="editorBackground" value="#1e1e1e">
                                            </div>
                                            <div class="color-item">
                                                <label>Foreground:</label>
                                                <input type="color" id="editorForeground" value="#d4d4d4">
                                            </div>
                                            <div class="color-item">
                                                <label>Selection:</label>
                                                <input type="color" id="editorSelectionBackground" value="#264f78">
                                            </div>
                                            <div class="color-item">
                                                <label>Line Highlight:</label>
                                                <input type="color" id="editorLineHighlight" value="#2a2d2e">
                                            </div>
                                            <div class="color-item">
                                                <label>Cursor:</label>
                                                <input type="color" id="editorCursor" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Indent Guide:</label>
                                                <input type="color" id="editorIndentGuide" value="#404040">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Activity Bar Section -->
                                <div class="theme-section">
                                    <h4>📁 Activity Bar</h4>
                                    <div class="section-description">Left sidebar with file explorer, search, git icons</div>
                                    
                                    <!-- Activity Bar Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Activity Bar Preview</h5>
                                        <div class="activitybar-section-preview" id="activitybarSectionPreview">
                                            <div class="mockup-activitybar" id="mockupActivitybar">
                                                <div class="activity-icon active" id="activityIconActive">▣</div>
                                                <div class="activity-icon" id="activityIconInactive1">⌕</div>
                                                <div class="activity-icon" id="activityIconInactive2">⚬</div>
                                                <div class="activity-icon" id="activityIconInactive3">⚙</div>
                                                <div class="activity-border" id="activityBorder"></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="activityBarBackground" value="#333333">
                                            </div>
                                            <div class="color-item">
                                                <label>Foreground:</label>
                                                <input type="color" id="activityBarForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive:</label>
                                                <input type="color" id="activityBarInactiveForeground" value="#ffffff66">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Background:</label>
                                                <input type="color" id="activityBarActiveBackground" value="#333333">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Border:</label>
                                                <input type="color" id="activityBarActiveBorder" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Border:</label>
                                                <input type="color" id="activityBarBorder" value="#333333">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Side Bar Section -->
                                <div class="theme-section">
                                    <h4>📂 Side Bar</h4>
                                    <div class="section-description">File explorer and other side panels</div>
                                    
                                    <!-- Side Bar Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Side Bar Preview</h5>
                                        <div class="sidebar-section-preview" id="sidebarSectionPreview">
                                            <div class="mockup-sidebar" id="mockupSidebar">
                                                <div class="sidebar-title">EXPLORER</div>
                                                <div class="file-tree">
                                                    <div class="file-item">📁 src</div>
                                                    <div class="file-item active" id="sidebarActiveItem">📄 main.ts</div>
                                                    <div class="file-item hover-item" id="sidebarHoverItem">📄 package.json</div>
                                                    <div class="file-item focus-item" id="sidebarFocusItem">📄 config.ts</div>
                                                </div>
                                                <div class="sidebar-border-example" id="sidebarBorderExample">Border example</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="sideBarBackground" value="#252526">
                                            </div>
                                            <div class="color-item">
                                                <label>Foreground:</label>
                                                <input type="color" id="sideBarForeground" value="#cccccc">
                                            </div>
                                            <div class="color-item">
                                                <label>Border:</label>
                                                <input type="color" id="sideBarBorder" value="#2d2d30">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sidebar Section Headers -->
                                <div class="theme-section">
                                    <h4>📑 Sidebar Section Headers</h4>
                                    <div class="section-description">Headers like "OUTLINE", "TIMELINE" in sidebar sections</div>
                                    
                                    <!-- Sidebar Section Headers Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Sidebar Section Headers Preview</h5>
                                        <div class="sidebar-headers-section-preview" id="sidebarHeadersSectionPreview">
                                            <div class="mockup-sidebar-headers" id="mockupSidebarHeaders">
                                                <div class="section-header" id="sectionHeaderPreview">
                                                    <span>OUTLINE</span>
                                                </div>
                                                <div class="section-content">
                                                    <div class="outline-item">📄 Component</div>
                                                    <div class="outline-item">⚙️ Methods</div>
                                                    <div class="outline-item">📝 Properties</div>
                                                </div>
                                                <div class="section-header" id="sectionHeaderPreview2">
                                                    <span>TIMELINE</span>
                                                </div>
                                                <div class="section-content">
                                                    <div class="timeline-item">💾 File saved</div>
                                                    <div class="timeline-item">📝 Edit made</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Section Header Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Header Background:</label>
                                                <input type="color" id="sideBarSectionHeaderBackground" value="#252526">
                                            </div>
                                            <div class="color-item">
                                                <label>Header Foreground:</label>
                                                <input type="color" id="sideBarSectionHeaderForeground" value="#cccccc">
                                            </div>
                                            <div class="color-item">
                                                <label>Header Border:</label>
                                                <input type="color" id="sideBarSectionHeaderBorder" value="#2d2d30">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Status Bar Section -->
                                <div class="theme-section">
                                    <h4>📊 Status Bar</h4>
                                    <div class="section-description">Bottom bar showing file info, errors, and extensions</div>
                                    
                                    <!-- Status Bar Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Status Bar Preview</h5>
                                        <div class="statusbar-section-preview" id="statusbarSectionPreview">
                                            <div class="mockup-statusbar" id="mockupStatusbar">
                                                <span>TypeScript • UTF-8 • Ln 3, Col 12</span>
                                                <span class="status-right">✓ VibeStudio Ready</span>
                                            </div>
                                            <div class="mockup-statusbar debug" id="mockupStatusbarDebug">
                                                <span>🐛 Debug Mode • Breakpoint Active</span>
                                                <span class="status-right">⏸️ Paused</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="statusBarBackground" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Foreground:</label>
                                                <input type="color" id="statusBarForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Border:</label>
                                                <input type="color" id="statusBarBorder" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Debug Background:</label>
                                                <input type="color" id="statusBarDebuggingBackground" value="#cc6633">
                                            </div>
                                            <div class="color-item">
                                                <label>Debug Foreground:</label>
                                                <input type="color" id="statusBarDebuggingForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>No Folder Background:</label>
                                                <input type="color" id="statusBarNoFolderBackground" value="#007acc">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tabs Section -->
                                <div class="theme-section">
                                    <h4>📑 Tabs</h4>
                                    <div class="section-description">Editor file tabs appearance (close button colors inherit from foreground colors)</div>
                                    
                                    <!-- Tabs Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Tabs Preview</h5>
                                        <div class="tabs-section-preview" id="tabsSectionPreview">
                                            <div class="editor-tabs" id="mockupTabs">
                                                <div class="tab active" id="activeTab">
                                                    <span>main.ts</span>
                                                    <span class="tab-close">×</span>
                                                    <div class="tab-border-top" id="activeTabBorder"></div>
                                                </div>
                                                <div class="tab inactive" id="inactiveTab">
                                                    <span>config.json</span>
                                                    <span class="tab-close">×</span>
                                                </div>
                                                <div class="tab hover-tab" id="hoverTab">
                                                    <span>styles.css</span>
                                                    <span class="tab-close">×</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Tab Bar Container</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Tab Bar Background:</label>
                                                <input type="color" id="editorGroupHeaderTabsBackground" value="#252526">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Active Tab Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Active Background:</label>
                                                <input type="color" id="tabActiveBackground" value="#1e1e1e">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Foreground:</label>
                                                <input type="color" id="tabActiveForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Border:</label>
                                                <input type="color" id="tabActiveBorder" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Border Top:</label>
                                                <input type="color" id="tabActiveBorderTop" value="#007acc">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Inactive Tab Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Inactive Background:</label>
                                                <input type="color" id="tabInactiveBackground" value="#2d2d30">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Foreground:</label>
                                                <input type="color" id="tabInactiveForeground" value="#cccccc80">
                                            </div>
                                            <div class="color-item">
                                                <label>Modified Border:</label>
                                                <input type="color" id="tabInactiveModifiedBorder" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Tab Border:</label>
                                                <input type="color" id="tabBorder" value="#2d2d30">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Unfocused Tab Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Unfocused Active Background:</label>
                                                <input type="color" id="tabUnfocusedActiveBackground" value="#1e1e1e">
                                            </div>
                                            <div class="color-item">
                                                <label>Unfocused Active Foreground:</label>
                                                <input type="color" id="tabUnfocusedActiveForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Unfocused Inactive Background:</label>
                                                <input type="color" id="tabUnfocusedInactiveBackground" value="#2d2d30">
                                            </div>
                                            <div class="color-item">
                                                <label>Unfocused Inactive Foreground:</label>
                                                <input type="color" id="tabUnfocusedInactiveForeground" value="#cccccc80">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Panel Tabs Section -->
                                <div class="theme-section">
                                    <h4>📋 Panel Tabs</h4>
                                    <div class="section-description">Bottom panel tabs like PROBLEMS, TERMINAL, OUTPUT, DEBUG CONSOLE</div>
                                    
                                    <!-- Panel Tabs Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Panel Tabs Preview</h5>
                                        <div class="panel-tabs-section-preview" id="panelTabsSectionPreview">
                                            <div class="mockup-panel-tabs" id="mockupPanelTabs">
                                                <div class="panel-tab active" id="activePanelTab">
                                                    <span>TERMINAL</span>
                                                    <div class="panel-tab-border" id="activePanelTabBorder"></div>
                                                </div>
                                                <div class="panel-tab inactive" id="inactivePanelTab1">
                                                    <span>PROBLEMS</span>
                                                </div>
                                                <div class="panel-tab inactive" id="inactivePanelTab2">
                                                    <span>OUTPUT</span>
                                                </div>
                                                <div class="panel-tab inactive" id="inactivePanelTab3">
                                                    <span>DEBUG CONSOLE</span>
                                                </div>
                                                <div class="panel-tab inactive" id="inactivePanelTab4">
                                                    <span>PORTS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Panel Tab Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Background:</label>
                                                <input type="color" id="panelTitleBackground" value="#252526">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Foreground:</label>
                                                <input type="color" id="panelTitleActiveForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Border:</label>
                                                <input type="color" id="panelTitleActiveBorder" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Foreground:</label>
                                                <input type="color" id="panelTitleInactiveForeground" value="#cccccc80">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Syntax Highlighting Section -->
                                <div class="theme-section">
                                    <h4>🎨 Syntax Highlighting</h4>
                                    <div class="section-description">Code syntax coloring for different programming languages</div>
                                    
                                    <!-- Syntax Highlighting Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Syntax Preview</h5>
                                        <div class="syntax-section-preview" id="syntaxSectionPreview">
                                            <div class="syntax-code">
                                                <div class="code-line">
                                                    <span class="line-number">1</span>
                                                    <span class="code-comment">// Syntax highlighting preview</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">2</span>
                                                    <span class="code-keyword">import</span> 
                                                    <span class="code-string">"./theme.css"</span><span class="code-punctuation">;</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">3</span>
                                                    <span class="code-keyword">interface</span> 
                                                    <span class="code-type">ThemeConfig</span> 
                                                    <span class="code-punctuation">{</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">4</span>
                                                    <span class="code-keyword">  const</span> 
                                                    <span class="code-variable">config</span><span class="code-punctuation">:</span> 
                                                    <span class="code-type">number</span> 
                                                    <span class="code-operator">=</span> 
                                                    <span class="code-number">42</span><span class="code-punctuation">;</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">5</span>
                                                    <span class="code-punctuation">}</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">6</span>
                                                    <span class="code-keyword">class</span> 
                                                    <span class="code-class">ThemeManager</span> 
                                                    <span class="code-punctuation">{</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">7</span>
                                                    <span class="code-function">  console</span><span class="code-punctuation">.</span><span class="code-function">log</span><span class="code-punctuation">(</span><span class="code-variable">config</span><span class="code-punctuation">);</span>
                                                </div>
                                                <div class="code-line">
                                                    <span class="line-number">8</span>
                                                    <span class="code-punctuation">}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Code Elements</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Comments:</label>
                                                <input type="color" id="syntaxComment" value="#6a9955">
                                            </div>
                                            <div class="color-item">
                                                <label>Keywords:</label>
                                                <input type="color" id="syntaxKeyword" value="#569cd6">
                                            </div>
                                            <div class="color-item">
                                                <label>Strings:</label>
                                                <input type="color" id="syntaxString" value="#ce9178">
                                            </div>
                                            <div class="color-item">
                                                <label>Numbers:</label>
                                                <input type="color" id="syntaxNumber" value="#b5cea8">
                                            </div>
                                            <div class="color-item">
                                                <label>Functions:</label>
                                                <input type="color" id="syntaxFunction" value="#dcdcaa">
                                            </div>
                                            <div class="color-item">
                                                <label>Variables:</label>
                                                <input type="color" id="syntaxVariable" value="#9cdcfe">
                                            </div>
                                            <div class="color-item">
                                                <label>Types:</label>
                                                <input type="color" id="syntaxType" value="#4ec9b0">
                                            </div>
                                            <div class="color-item">
                                                <label>Classes:</label>
                                                <input type="color" id="syntaxClass" value="#4ec9b0">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Title Bar Section -->
                                <div class="theme-section">
                                    <h4>🏷️ Title Bar</h4>
                                    <div class="section-description">VS Code window title bar appearance</div>
                                    
                                    <!-- Title Bar Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Title Bar Preview</h5>
                                        <div class="titlebar-section-preview" id="titlebarSectionPreview">
                                            <div class="mockup-titlebar active" id="mockupTitlebarActive">
                                                <span class="titlebar-text">VS Code - VibeStudio Theme Customizer</span>
                                                <span class="titlebar-controls">⚪ ⚪ ⚪</span>
                                            </div>
                                            <div class="mockup-titlebar inactive" id="mockupTitlebarInactive">
                                                <span class="titlebar-text">VS Code (Inactive)</span>
                                                <span class="titlebar-controls">⚪ ⚪ ⚪</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Active Background:</label>
                                                <input type="color" id="titleBarActiveBackground" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Foreground:</label>
                                                <input type="color" id="titleBarActiveForeground" value="#cccccc">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Background:</label>
                                                <input type="color" id="titleBarInactiveBackground" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Foreground:</label>
                                                <input type="color" id="titleBarInactiveForeground" value="#cccccc">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- List & Tree Section -->
                                <div class="theme-section">
                                    <h4>📋 List & Tree</h4>
                                    <div class="section-description">File explorer, search results, and other list views</div>
                                    
                                    <!-- List & Tree Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 List & Tree Preview</h5>
                                        <div class="list-tree-section-preview" id="listTreeSectionPreview">
                                            <div class="tree-container">
                                                <div class="tree-header">EXPLORER</div>
                                                <div class="tree-content">
                                                    <div class="tree-item active-selection" id="listActiveSelectionPreview">📁 src (Active Selection)</div>
                                                    <div class="tree-item inactive-selection" id="listInactiveSelectionPreview">📄 main.ts (Inactive Selection)</div>
                                                    <div class="tree-item hover-item" id="listHoverPreview">📄 package.json (Hover)</div>
                                                    <div class="tree-item focus-item" id="listFocusPreview">📄 config.ts (Focus)</div>
                                                    <div class="tree-item normal-item" id="listNormalPreview">📄 README.md (Normal)</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Selection Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Active Selection Background:</label>
                                                <input type="color" id="listActiveSelectionBackground" value="#094771">
                                            </div>
                                            <div class="color-item">
                                                <label>Active Selection Foreground:</label>
                                                <input type="color" id="listActiveSelectionForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Selection Background:</label>
                                                <input type="color" id="listInactiveSelectionBackground" value="#37373d">
                                            </div>
                                            <div class="color-item">
                                                <label>Inactive Selection Foreground:</label>
                                                <input type="color" id="listInactiveSelectionForeground" value="#cccccc">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Hover & Focus Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Hover Background:</label>
                                                <input type="color" id="listHoverBackground" value="#2a2d2e">
                                            </div>
                                            <div class="color-item">
                                                <label>Hover Foreground:</label>
                                                <input type="color" id="listHoverForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Focus Background:</label>
                                                <input type="color" id="listFocusBackground" value="#094771">
                                            </div>
                                            <div class="color-item">
                                                <label>Focus Foreground:</label>
                                                <input type="color" id="listFocusForeground" value="#ffffff">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- UI Controls Section -->
                                <div class="theme-section">
                                    <h4>🎛️ UI Controls</h4>
                                    <div class="section-description">Interactive elements like buttons, inputs, dropdowns, and lists</div>
                                    
                                    <!-- UI Controls Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 UI Controls Preview</h5>
                                        <div class="ui-controls-section-preview" id="uiControlsSectionPreview">
                                            <div class="ui-elements">
                                                <div class="ui-group">
                                                    <h6>Buttons</h6>
                                                    <button class="preview-button primary" id="previewButtonPrimary">Primary Button</button>
                                                    <button class="preview-button secondary" id="previewButtonSecondary">Secondary</button>
                                                    <button class="preview-button hover" id="previewButtonHover">Hover State</button>
                                                </div>
                                                
                                                <div class="ui-group">
                                                    <h6>Inputs & Controls</h6>
                                                    <input type="text" class="preview-input" id="previewInput" placeholder="Input field">
                                                    <select class="preview-dropdown" id="previewDropdown">
                                                        <option>Dropdown</option>
                                                        <option>Options</option>
                                                    </select>
                                                    <label class="preview-checkbox" id="previewCheckboxContainer">
                                                        <input type="checkbox" id="previewCheckbox">
                                                        Checkbox
                                                    </label>
                                                </div>
                                                
                                                <div class="ui-group">
                                                    <h6>Lists & Trees</h6>
                                                    <div class="preview-list" id="previewList">
                                                        <div class="list-item active" id="listItemActive">Active Selection</div>
                                                        <div class="list-item inactive" id="listItemInactive">Inactive Selection</div>
                                                        <div class="list-item hover" id="listItemHover">Hover Item</div>
                                                        <div class="list-item focus" id="listItemFocus">Focus Item</div>
                                                    </div>
                                                </div>
                                                
                                                <div class="ui-group">
                                                    <h6>Progress & Badge</h6>
                                                    <div class="preview-progress" id="previewProgress">
                                                        <div class="progress-bar" id="previewProgressBar"></div>
                                                    </div>
                                                    <div class="preview-badge" id="previewBadge">12</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Button Colors</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Primary Background:</label>
                                                <input type="color" id="buttonPrimaryBackground" value="#0e639c">
                                            </div>
                                            <div class="color-item">
                                                <label>Primary Foreground:</label>
                                                <input type="color" id="buttonPrimaryForeground" value="#ffffff">
                                            </div>
                                            <div class="color-item">
                                                <label>Secondary Background:</label>
                                                <input type="color" id="buttonSecondaryBackground" value="#5f6a79">
                                            </div>
                                            <div class="color-item">
                                                <label>Secondary Foreground:</label>
                                                <input type="color" id="buttonSecondaryForeground" value="#ffffff">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Input Controls</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Input Background:</label>
                                                <input type="color" id="inputBackground" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Input Foreground:</label>
                                                <input type="color" id="inputForeground" value="#cccccc">
                                            </div>
                                            <div class="color-item">
                                                <label>Input Border:</label>
                                                <input type="color" id="inputBorder" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Input Placeholder:</label>
                                                <input type="color" id="inputPlaceholder" value="#cccccc80">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Dropdown & Checkbox</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Dropdown Background:</label>
                                                <input type="color" id="dropdownBackground" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Dropdown Foreground:</label>
                                                <input type="color" id="dropdownForeground" value="#cccccc">
                                            </div>
                                            <div class="color-item">
                                                <label>Checkbox Background:</label>
                                                <input type="color" id="checkboxBackground" value="#3c3c3c">
                                            </div>
                                            <div class="color-item">
                                                <label>Checkbox Border:</label>
                                                <input type="color" id="checkboxBorder" value="#3c3c3c">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Progress & Badge</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Progress Bar:</label>
                                                <input type="color" id="progressBarColor" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Badge Background:</label>
                                                <input type="color" id="badgeBackground" value="#007acc">
                                            </div>
                                            <div class="color-item">
                                                <label>Badge Foreground:</label>
                                                <input type="color" id="badgeForeground" value="#ffffff">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Scrollbar, Breadcrumb, Gutter & Minimap Section -->
                                <div class="theme-section">
                                    <h4>📜 Scrollbar, Breadcrumb & Editor Elements</h4>
                                    <div class="section-description">Scrollbars, breadcrumb navigation, editor gutter, and minimap styling</div>
                                    
                                    <!-- Live Preview -->
                                    <div class="section-preview">
                                        <h5>🔍 Scrollbar & Editor Elements Preview</h5>
                                        <div class="scrollbar-elements-preview" id="scrollbarElementsPreview">
                                            <div class="preview-editor-area">
                                                <!-- Breadcrumb preview -->
                                                <div class="breadcrumb-preview" id="breadcrumbPreview">
                                                    <span class="breadcrumb-segment">src</span>
                                                    <span class="breadcrumb-separator">›</span>
                                                    <span class="breadcrumb-segment">components</span>
                                                    <span class="breadcrumb-separator">›</span>
                                                    <span class="breadcrumb-segment active">App.tsx</span>
                                                </div>
                                                
                                                <!-- Editor with gutter -->
                                                <div class="editor-with-gutter">
                                                    <div class="gutter-preview" id="gutterPreview">
                                                        <div class="line-number">1</div>
                                                        <div class="line-number">2</div>
                                                        <div class="line-number">3</div>
                                                        <div class="line-number">4</div>
                                                        <div class="line-number">5</div>
                                                    </div>
                                                    <div class="editor-content">
                                                        <div class="code-line">import React from 'react';</div>
                                                        <div class="code-line">import './App.css';</div>
                                                        <div class="code-line"></div>
                                                        <div class="code-line">function App() {</div>
                                                        <div class="code-line">  return <div>Hello</div>;</div>
                                                    </div>
                                                    <!-- Minimap -->
                                                    <div class="minimap-container">
                                                        <div class="minimap-preview" id="minimapPreview">
                                                            <div class="minimap-slider" id="minimapSliderPreview"></div>
                                                            <div class="minimap-content">
                                                                <div class="minimap-line"></div>
                                                                <div class="minimap-line"></div>
                                                                <div class="minimap-line active"></div>
                                                                <div class="minimap-line"></div>
                                                                <div class="minimap-line"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <!-- Scrollbar preview -->
                                                <div class="scrollbar-container">
                                                    <div class="scrollbar-preview" id="scrollbarPreview">
                                                        <div class="scrollbar-track">
                                                            <div class="scrollbar-slider normal" id="scrollbarSliderNormal"></div>
                                                            <div class="scrollbar-slider hover" id="scrollbarSliderHover"></div>
                                                            <div class="scrollbar-slider active" id="scrollbarSliderActive"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Breadcrumb Navigation</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Breadcrumb Background:</label>
                                                <input type="color" id="breadcrumbBackground" value="#1e1e1e">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Editor Gutter</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Gutter Background:</label>
                                                <input type="color" id="editorGutterBackground" value="#1e1e1e">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Scrollbar</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Slider Background:</label>
                                                <input type="color" id="scrollbarSliderBackground" value="#79797966">
                                            </div>
                                            <div class="color-item">
                                                <label>Slider Hover:</label>
                                                <input type="color" id="scrollbarSliderHoverBackground" value="#646464b3">
                                            </div>
                                            <div class="color-item">
                                                <label>Slider Active:</label>
                                                <input type="color" id="scrollbarSliderActiveBackground" value="#bfbfbf66">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="subsection">
                                        <h5>Minimap</h5>
                                        <div class="color-grid">
                                            <div class="color-item">
                                                <label>Minimap Background:</label>
                                                <input type="color" id="minimapBackground" value="#1e1e1e">
                                            </div>
                                            <div class="color-item">
                                                <label>Minimap Slider:</label>
                                                <input type="color" id="minimapSliderBackground" value="#79797966">
                                            </div>
                                            <div class="color-item">
                                                <label>Minimap Slider Hover:</label>
                                                <input type="color" id="minimapSliderHoverBackground" value="#646464b3">
                                            </div>
                                            <div class="color-item">
                                                <label>Minimap Slider Active:</label>
                                                <input type="color" id="minimapSliderActiveBackground" value="#bfbfbf66">
                                            </div>
                                            <div class="color-item">
                                                <label>Slider Transparency:</label>
                                                <input type="range" id="minimapSliderTransparency" min="10" max="100" value="60" step="5">
                                                <span id="minimapSliderTransparencyValue">60%</span>
                                            </div>
                                            <div class="color-item">
                                                <label>Hover Transparency:</label>
                                                <input type="range" id="minimapSliderHoverTransparency" min="10" max="100" value="80" step="5">
                                                <span id="minimapSliderHoverTransparencyValue">80%</span>
                                            </div>
                                            <div class="color-item">
                                                <label>Active Transparency:</label>
                                                <input type="range" id="minimapSliderActiveTransparency" min="10" max="100" value="100" step="5">
                                                <span id="minimapSliderActiveTransparencyValue">100%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        </div>
                    </div>
                </div>

                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    
                    // Initialize event listeners
                    document.addEventListener('DOMContentLoaded', function() {
                        console.log('DOM loaded, setting up event listeners...');
                        
                        // Apply button
                        document.getElementById('applyBtn').addEventListener('click', function() {
                            const themeData = gatherThemeData();
                            vscode.postMessage({ type: 'applyTheme', data: themeData });
                        });
                        
                        // Reset button
                        document.getElementById('resetBtn').addEventListener('click', function() {
                            vscode.postMessage({ type: 'resetTheme' });
                        });
                        
                        // ALL color and input elements that should trigger live preview updates
                        const allInputs = [
                            // Terminal colors
                            'backgroundColor', 'foregroundColor', 'cursorColor', 'selectionColor', 'fontSize',
                            // Editor colors
                            'editorBackground', 'editorForeground', 'editorSelectionBackground', 'editorLineHighlight',
                            'editorCursor', 'editorIndentGuide', 
                            // Activity Bar colors - CRITICAL for fixing activity bar preview
                            'activityBarBackground', 'activityBarForeground', 'activityBarInactiveForeground', 'activityBarActiveBackground', 'activityBarActiveBorder', 'activityBarBorder',
                            // Sidebar colors
                            'sideBarBackground', 'sideBarForeground', 'sideBarBorder',
                            // Sidebar Section Header colors
                            'sideBarSectionHeaderBackground', 'sideBarSectionHeaderForeground', 'sideBarSectionHeaderBorder', 
                            // Status Bar colors - CRITICAL for fixing debug mode
                            'statusBarBackground', 'statusBarForeground', 'statusBarBorder', 'statusBarDebuggingBackground', 'statusBarDebuggingForeground', 'statusBarNoFolderBackground',
                            // Tab colors
                            'editorGroupHeaderTabsBackground', 'tabActiveBackground', 'tabActiveForeground', 'tabActiveBorder', 'tabActiveBorderTop', 'tabInactiveBackground', 'tabInactiveForeground', 'tabInactiveModifiedBorder', 'tabBorder', 'tabUnfocusedActiveBackground', 'tabUnfocusedActiveForeground', 'tabUnfocusedInactiveBackground', 'tabUnfocusedInactiveForeground',
                            // Panel Tab colors
                            'panelTitleBackground', 'panelTitleActiveForeground', 'panelTitleActiveBorder', 'panelTitleInactiveForeground',
                            // Title Bar colors
                            'titleBarActiveBackground', 'titleBarActiveForeground', 'titleBarInactiveBackground', 'titleBarInactiveForeground',
                            // Syntax colors
                            'syntaxComment', 'syntaxKeyword', 'syntaxString', 'syntaxNumber', 'syntaxFunction',
                            'syntaxVariable', 'syntaxType', 'syntaxClass',
                            // List & Tree colors
                            'listActiveSelectionBackground', 'listActiveSelectionForeground', 'listInactiveSelectionBackground', 'listInactiveSelectionForeground', 'listHoverBackground', 'listHoverForeground', 'listFocusBackground', 'listFocusForeground',
                            // UI Controls inputs
                            'buttonPrimaryBackground', 'buttonPrimaryForeground', 'buttonSecondaryBackground', 
                            'buttonSecondaryForeground', 'inputBackground', 'inputForeground', 'inputBorder', 'inputPlaceholder',
                            'dropdownBackground', 'dropdownForeground', 'checkboxBackground', 'checkboxBorder',
                            'progressBarColor', 'badgeBackground', 'badgeForeground',
                            // Scrollbar, breadcrumb, gutter, and minimap colors
                            'breadcrumbBackground', 'editorGutterBackground', 'scrollbarSliderBackground', 
                            'scrollbarSliderHoverBackground', 'scrollbarSliderActiveBackground',
                            'minimapBackground', 'minimapSliderBackground', 'minimapSliderHoverBackground', 'minimapSliderActiveBackground',
                            'minimapSliderTransparency', 'minimapSliderHoverTransparency', 'minimapSliderActiveTransparency',
                            // Legacy support for old controls
                            'listActiveSelection', 'listHover'
                        ];
                        
                        // Set up event listeners for ALL inputs with BOTH input and change events
                        allInputs.forEach(id => {
                            const input = document.getElementById(id);
                            if (input) {
                                // Use both 'input' for real-time updates and 'change' for final updates
                                input.addEventListener('input', function() {
                                    console.log('Input changed: ' + id + ' = ' + input.value);
                                    // Update transparency value displays
                                    if (id === 'minimapSliderTransparency') {
                                        document.getElementById('minimapSliderTransparencyValue').textContent = input.value + '%';
                                    } else if (id === 'minimapSliderHoverTransparency') {
                                        document.getElementById('minimapSliderHoverTransparencyValue').textContent = input.value + '%';
                                    } else if (id === 'minimapSliderActiveTransparency') {
                                        document.getElementById('minimapSliderActiveTransparencyValue').textContent = input.value + '%';
                                    }
                                    updateLivePreview();
                                });
                                input.addEventListener('change', function() {
                                    console.log('Change event: ' + id + ' = ' + input.value);
                                    updateLivePreview();
                                });
                            } else {
                                console.warn('Input element not found: ' + id);
                            }
                        });
                        
                        // Request presets
                        vscode.postMessage({ type: 'getPresets' });
                        
                        // Initial preview update
                        console.log('Setting up initial preview...');
                        updateLivePreview();
                    });
                    
                    function updateLivePreview() {
                        // LIVE PREVIEW: Only update the visual preview in the webview
                        // This NEVER touches the actual VS Code terminal - only the preview
                        updatePreview();
                    }
                    
                    // Helper function to safely get element values with fallbacks
                    function getElementValue(id, defaultValue) {
                        const element = document.getElementById(id);
                        return element ? element.value : defaultValue;
                    }
                    
                    function gatherThemeData() {
                        // Always enable editor theming since UI shows editor options
                        const enableEditorTheme = true;
                        
                        const themeData = {
                            name: 'Custom Theme',
                            version: '1.0.0',
                            created: new Date().toISOString(),
                            modified: new Date().toISOString(),
                            
                            font: {
                                family: 'Consolas, monospace',
                                size: parseInt(getElementValue('fontSize', '14')) || 14,
                                weight: 'normal',
                                ligatures: false,
                                lineHeight: 1.2
                            },
                            
                            cursor: {
                                style: 'block',
                                blinking: false,
                                color: getElementValue('cursorColor', '#ffffff')
                            },
                            
                            colors: {
                                background: getElementValue('backgroundColor', '#000000'),
                                foreground: getElementValue('foregroundColor', '#ffffff'),
                                selection: getElementValue('selectionColor', '#ffffff') + '40',
                                selectionBackground: getElementValue('selectionColor', '#ffffff') + '40',
                                
                                // Default ANSI colors
                                ansiBlack: '#000000',
                                ansiRed: '#cd3131',
                                ansiGreen: '#0dbc79',
                                ansiYellow: '#e5e510',
                                ansiBlue: '#2472c8',
                                ansiMagenta: '#bc3fbc',
                                ansiCyan: '#11a8cd',
                                ansiWhite: '#e5e5e5',
                                ansiBrightBlack: '#666666',
                                ansiBrightRed: '#f14c4c',
                                ansiBrightGreen: '#23d18b',
                                ansiBrightYellow: '#f5f543',
                                ansiBrightBlue: '#3b8eea',
                                ansiBrightMagenta: '#d670d6',
                                ansiBrightCyan: '#29b8db',
                                ansiBrightWhite: '#e5e5e5',
                                
                                border: '#333333',
                                tab: {
                                    activeForeground: '#ffffff',
                                    activeBackground: '#333333',
                                    inactiveForeground: '#cccccc',
                                    inactiveBackground: '#2d2d30',
                                    border: '#333333'
                                }
                            },
                            
                            integration: {
                                applyToEditor: true,
                                applyToTerminal: true,
                                applyToWorkbench: true
                            },
                            
                            effects: {
                                transparency: 0,
                                blur: 0,
                                animations: false,
                                particleEffects: false,
                                glowEffect: false,
                                scanlines: false,
                                crtEffect: false
                            }
                        };

                        // Always add editor theme data since UI shows editor options
                        if (enableEditorTheme) {
                            themeData.editorTheme = {
                                editor: {
                                    background: getElementValue('editorBackground', '#1e1e1e'),
                                    foreground: getElementValue('editorForeground', '#d4d4d4'),
                                    selectionBackground: getElementValue('editorSelectionBackground', '#264f78'),
                                    lineHighlightBackground: getElementValue('editorLineHighlight', '#2a2d2e'),
                                    cursorColor: getElementValue('editorCursor', '#ffffff'),
                                    indentGuideBackground: getElementValue('editorIndentGuide', '#404040'),
                                    indentGuideActiveBackground: getElementValue('editorIndentGuide', '#404040') + '80'
                                },
                                activityBar: {
                                    background: getElementValue('activityBarBackground', '#333333'),
                                    foreground: getElementValue('activityBarForeground', '#ffffff'),
                                    inactiveForeground: getElementValue('activityBarInactiveForeground', '#ffffff66'),
                                    border: getElementValue('activityBarBorder', '#333333'),
                                    activeBorder: getElementValue('activityBarActiveBorder', '#007acc'),
                                    activeBackground: getElementValue('activityBarActiveBackground', '#333333')
                                },
                                sideBar: {
                                    background: getElementValue('sideBarBackground', '#252526'),
                                    foreground: getElementValue('sideBarForeground', '#cccccc'),
                                    border: getElementValue('sideBarBorder', '#2d2d30')
                                },
                                sideBarSectionHeader: {
                                    background: getElementValue('sideBarSectionHeaderBackground', '#252526'),
                                    foreground: getElementValue('sideBarSectionHeaderForeground', '#cccccc'),
                                    border: getElementValue('sideBarSectionHeaderBorder', '#2d2d30')
                                },
                                statusBar: {
                                    background: getElementValue('statusBarBackground', '#007acc'),
                                    foreground: getElementValue('statusBarForeground', '#ffffff'),
                                    border: getElementValue('statusBarBorder', '#007acc'),
                                    debuggingBackground: getElementValue('statusBarDebuggingBackground', '#cc6633'),
                                    debuggingForeground: getElementValue('statusBarDebuggingForeground', '#ffffff'),
                                    noFolderBackground: getElementValue('statusBarNoFolderBackground', '#007acc'),
                                    noFolderForeground: getElementValue('statusBarForeground', '#ffffff')
                                },
                                titleBar: {
                                    activeBackground: getElementValue('titleBarActiveBackground', '#3c3c3c'),
                                    activeForeground: getElementValue('titleBarActiveForeground', '#cccccc'),
                                    inactiveBackground: getElementValue('titleBarInactiveBackground', '#3c3c3c'),
                                    inactiveForeground: getElementValue('titleBarInactiveForeground', '#cccccc'),
                                    border: getElementValue('titleBarActiveBackground', '#3c3c3c')
                                },
                                tab: {
                                    background: getElementValue('editorGroupHeaderTabsBackground', '#252526'),
                                    activeBackground: getElementValue('tabActiveBackground', '#1e1e1e'),
                                    activeForeground: getElementValue('tabActiveForeground', '#ffffff'),
                                    activeBorder: getElementValue('tabActiveBorder', '#007acc'),
                                    activeBorderTop: getElementValue('tabActiveBorderTop', '#007acc'),
                                    inactiveBackground: getElementValue('tabInactiveBackground', '#2d2d30'),
                                    inactiveForeground: getElementValue('tabInactiveForeground', '#cccccc80'),
                                    inactiveModifiedBorder: getElementValue('tabInactiveModifiedBorder', '#007acc'),
                                    unfocusedActiveBackground: getElementValue('tabUnfocusedActiveBackground', '#1e1e1e'),
                                    unfocusedActiveForeground: getElementValue('tabUnfocusedActiveForeground', '#ffffff'),
                                    unfocusedInactiveBackground: getElementValue('tabUnfocusedInactiveBackground', '#2d2d30'),
                                    unfocusedInactiveForeground: getElementValue('tabUnfocusedInactiveForeground', '#cccccc80'),
                                    border: getElementValue('tabBorder', '#2d2d30')
                                },
                                panelTitle: {
                                    background: getElementValue('panelTitleBackground', '#252526'),
                                    activeForeground: getElementValue('panelTitleActiveForeground', '#ffffff'),
                                    activeBorder: getElementValue('panelTitleActiveBorder', '#007acc'),
                                    inactiveForeground: getElementValue('panelTitleInactiveForeground', '#cccccc80')
                                },
                                input: {
                                    background: getElementValue('inputBackground', '#3c3c3c'),
                                    foreground: getElementValue('inputForeground', '#cccccc'),
                                    border: getElementValue('inputBorder', '#3c3c3c'),
                                    placeholderForeground: getElementValue('inputPlaceholder', '#cccccc80')
                                },
                                dropdown: {
                                    background: getElementValue('dropdownBackground', '#3c3c3c'),
                                    foreground: getElementValue('dropdownForeground', '#cccccc'),
                                    border: getElementValue('inputBorder', '#3c3c3c')
                                },
                                button: {
                                    background: getElementValue('buttonPrimaryBackground', '#0e639c'),
                                    foreground: getElementValue('buttonPrimaryForeground', '#ffffff'),
                                    hoverBackground: getElementValue('buttonPrimaryBackground', '#1177bb'),
                                    secondaryBackground: getElementValue('buttonSecondaryBackground', '#5f6a79'),
                                    secondaryForeground: getElementValue('buttonSecondaryForeground', '#ffffff'),
                                    secondaryHoverBackground: getElementValue('buttonSecondaryBackground', '#1177bb')
                                },
                                checkbox: {
                                    background: getElementValue('checkboxBackground', '#3c3c3c'),
                                    foreground: getElementValue('inputForeground', '#cccccc'),
                                    border: getElementValue('checkboxBorder', '#3c3c3c')
                                },
                                badge: {
                                    background: getElementValue('badgeBackground', '#007acc'),
                                    foreground: getElementValue('badgeForeground', '#ffffff')
                                },
                                progressBar: {
                                    background: getElementValue('progressBarColor', '#007acc')
                                },
                                list: {
                                    activeSelectionBackground: getElementValue('listActiveSelectionBackground', '#094771'),
                                    activeSelectionForeground: getElementValue('listActiveSelectionForeground', '#ffffff'),
                                    inactiveSelectionBackground: getElementValue('listInactiveSelectionBackground', '#37373d'),
                                    inactiveSelectionForeground: getElementValue('listInactiveSelectionForeground', '#cccccc'),
                                    hoverBackground: getElementValue('listHoverBackground', '#2a2d2e'),
                                    hoverForeground: getElementValue('listHoverForeground', '#ffffff'),
                                    focusBackground: getElementValue('listFocusBackground', '#094771'),
                                    focusForeground: getElementValue('listFocusForeground', '#ffffff')
                                },
                                syntax: {
                                    comment: getElementValue('syntaxComment', '#6a9955'),
                                    keyword: getElementValue('syntaxKeyword', '#569cd6'),
                                    string: getElementValue('syntaxString', '#ce9178'),
                                    number: getElementValue('syntaxNumber', '#b5cea8'),
                                    function: getElementValue('syntaxFunction', '#dcdcaa'),
                                    variable: getElementValue('syntaxVariable', '#9cdcfe'),
                                    type: getElementValue('syntaxType', '#4ec9b0'),
                                    class: getElementValue('syntaxClass', '#4ec9b0'),
                                    interface: getElementValue('syntaxType', '#4ec9b0'),
                                    namespace: getElementValue('syntaxType', '#4ec9b0'),
                                    operator: getElementValue('syntaxKeyword', '#569cd6'),
                                    punctuation: getElementValue('editorForeground', '#d4d4d4'),
                                    constant: getElementValue('syntaxNumber', '#b5cea8'),
                                    property: getElementValue('syntaxVariable', '#9cdcfe'),
                                    tag: getElementValue('syntaxKeyword', '#569cd6'),
                                    attribute: getElementValue('syntaxString', '#ce9178')
                                },
                                breadcrumb: {
                                    background: getElementValue('breadcrumbBackground', '#1e1e1e')
                                },
                                editorGutter: {
                                    background: getElementValue('editorGutterBackground', '#1e1e1e')
                                },
                                scrollbar: {
                                    shadow: getElementValue('scrollbarShadow', '#000000'),
                                    sliderBackground: getElementValue('scrollbarSliderBackground', '#79797966'),
                                    sliderHoverBackground: getElementValue('scrollbarSliderHoverBackground', '#646464b3'),
                                    sliderActiveBackground: getElementValue('scrollbarSliderActiveBackground', '#bfbfbf66')
                                },
                                minimap: {
                                    background: getElementValue('minimapBackground', '#1e1e1e'),
                                    sliderBackground: (() => {
                                        const baseColor = getElementValue('minimapSliderBackground', '#797979');
                                        const transparency = getElementValue('minimapSliderTransparency', '60');
                                        const alpha = Math.round((parseInt(transparency) / 100) * 255).toString(16).padStart(2, '0');
                                        return baseColor + alpha;
                                    })(),
                                    sliderHoverBackground: (() => {
                                        const baseColor = getElementValue('minimapSliderHoverBackground', '#646464');
                                        const transparency = getElementValue('minimapSliderHoverTransparency', '80');
                                        const alpha = Math.round((parseInt(transparency) / 100) * 255).toString(16).padStart(2, '0');
                                        return baseColor + alpha;
                                    })(),
                                    sliderActiveBackground: (() => {
                                        const baseColor = getElementValue('minimapSliderActiveBackground', '#bfbfbf');
                                        const transparency = getElementValue('minimapSliderActiveTransparency', '100');
                                        const alpha = Math.round((parseInt(transparency) / 100) * 255).toString(16).padStart(2, '0');
                                        return baseColor + alpha;
                                    })()
                                }
                            };
                        }

                        return themeData;
                    }
                    
                    function updatePreview() {
                        // This function ONLY updates the visual preview in the webview
                        // It NEVER sends any messages to VS Code or changes the actual application
                        updateTerminalPreview();
                        updateEditorSectionPreview();
                        updateActivityBarSectionPreview();
                        updateSideBarSectionPreview();
                        updateSidebarHeadersSectionPreview();
                        updateStatusBarSectionPreview();
                        updateTabsSectionPreview();
                        updatePanelTabsSectionPreview();
                        updateTitleBarSectionPreview();
                        updateListTreeSectionPreview();
                        updateScrollbarSectionPreview();
                        updateScrollbarElementsPreview();
                        updateSyntaxSectionPreview();
                        updateUIControlsSectionPreview();
                    }
                    
                    function updateTerminalPreview() {
                        const preview = document.getElementById('terminalPreview');
                        if (!preview) return;
                        
                        const backgroundColor = getElementValue('backgroundColor', '#000000');
                        const foregroundColor = getElementValue('foregroundColor', '#ffffff');
                        const cursorColor = getElementValue('cursorColor', '#ffffff');
                        const selectionColor = getElementValue('selectionColor', '#ffffff');
                        const fontSize = getElementValue('fontSize', '14');
                        
                        // Update terminal preview (visual only)
                        preview.style.backgroundColor = backgroundColor;
                        preview.style.color = foregroundColor;
                        preview.style.fontFamily = 'Consolas, monospace';
                        preview.style.fontSize = fontSize + 'px';
                        
                        // Update foreground color examples
                        const foregroundElements = preview.querySelectorAll('.terminal-foreground');
                        foregroundElements.forEach(element => {
                            element.style.color = foregroundColor;
                        });
                        
                        // Update cursor color
                        const cursors = preview.querySelectorAll('.cursor');
                        cursors.forEach(cursor => {
                            cursor.style.backgroundColor = cursorColor;
                            cursor.style.color = backgroundColor; // Inverse for visibility
                        });
                        
                        // Update selection color examples
                        const selections = preview.querySelectorAll('.terminal-selection');
                        selections.forEach(selection => {
                            selection.style.backgroundColor = selectionColor + '60'; // Add transparency
                            selection.style.color = backgroundColor; // Contrast text
                        });
                        
                        // Update ANSI colors in preview (using defaults)
                        const greenText = preview.querySelector('.success');
                        if (greenText) greenText.style.color = '#0dbc79'; // Default green
                        
                        const warningText = preview.querySelector('.warning');
                        if (warningText) warningText.style.color = '#e5e510'; // Default yellow
                        
                        const errorText = preview.querySelector('.error');
                        if (errorText) errorText.style.color = '#cd3131'; // Default red
                    }
                    
                    function updateEditorSectionPreview() {
                        // Update editor section preview
                        const editorPreview = document.getElementById('editorSectionPreview');
                        if (editorPreview) {
                            const bgColor = getElementValue('editorBackground', '#1e1e1e');
                            const fgColor = getElementValue('editorForeground', '#d4d4d4');
                            editorPreview.style.backgroundColor = bgColor;
                            editorPreview.style.color = fgColor;
                            
                            // Update all foreground examples
                            const foregroundElements = editorPreview.querySelectorAll('.editor-foreground-example');
                            foregroundElements.forEach(element => {
                                element.style.color = fgColor;
                            });
                        }
                        
                        // Update editor elements in section preview
                        updateElementBgColor('lineHighlighted', 'editorLineHighlight', '#2a2d2e');
                        
                        // Update selection example
                        const selectionElement = document.getElementById('editorSelectionExample');
                        if (selectionElement) {
                            const selectionColor = getElementValue('editorSelectionBackground', '#264f78');
                            selectionElement.style.backgroundColor = selectionColor;
                            selectionElement.style.color = getElementValue('editorForeground', '#d4d4d4');
                        }
                        
                        // Update cursor
                        updateElementColor('editorCursorPreview', 'editorCursor', '#ffffff');
                        
                        // Update indent guides
                        const indentGuides = document.querySelectorAll('.indent-guide-visual');
                        const indentColor = getElementValue('editorIndentGuide', '#404040');
                        indentGuides.forEach(guide => {
                            guide.style.color = indentColor;
                            guide.style.borderLeft = '1px solid ' + indentColor;
                        });
                        
                        // Update active indent guide
                        const activeIndentGuide = document.getElementById('indentGuideActive');
                        if (activeIndentGuide) {
                            const activeColor = getElementValue('editorIndentGuide', '#404040');
                            activeIndentGuide.style.color = activeColor;
                            activeIndentGuide.style.borderLeft = '2px solid ' + activeColor;
                            activeIndentGuide.style.fontWeight = 'bold';
                        }
                    }
                    
                    function updateActivityBarSectionPreview() {
                        console.log('Updating activity bar preview...');
                        
                        // Update activity bar background
                        const activityBar = document.getElementById('mockupActivitybar');
                        if (activityBar) {
                            const bgColor = getElementValue('activityBarBackground', '#333333');
                            activityBar.style.setProperty('background-color', bgColor, 'important');
                            console.log('Activity bar background updated:', bgColor);
                        }
                        
                        // Update active icon (foreground example) - CRITICAL FIX
                        const activeIcon = document.getElementById('activityIconActive');
                        if (activeIcon) {
                            const activeFgColor = getElementValue('activityBarForeground', '#ffffff');
                            
                            // Use setProperty with important to override CSS
                            activeIcon.style.setProperty('color', activeFgColor, 'important');
                            activeIcon.style.setProperty('background-color', 'transparent', 'important');
                            activeIcon.style.setProperty('font-weight', 'bold', 'important');
                            activeIcon.style.setProperty('opacity', '1', 'important');
                            activeIcon.style.setProperty('transform', 'scale(1.1)', 'important');
                            
                            console.log('Activity bar active icon updated:', { activeFgColor });
                        } else {
                            console.warn('Activity bar active icon not found!');
                        }
                        
                        // Update inactive icons (inactive foreground example) - CRITICAL FIX
                        const inactiveIconIds = ['activityIconInactive1', 'activityIconInactive2', 'activityIconInactive3'];
                        const inactiveFgColor = getElementValue('activityBarInactiveForeground', '#ffffff66');
                        
                        inactiveIconIds.forEach(iconId => {
                            const icon = document.getElementById(iconId);
                            if (icon) {
                                // Use setProperty with important to override CSS
                                icon.style.setProperty('color', inactiveFgColor, 'important');
                                icon.style.setProperty('background-color', 'transparent', 'important');
                                icon.style.setProperty('opacity', '0.6', 'important');
                                icon.style.setProperty('font-weight', 'normal', 'important');
                                icon.style.setProperty('transform', 'scale(1)', 'important');
                                
                                console.log('Activity bar inactive icon updated:', iconId, { inactiveFgColor });
                            } else {
                                console.warn('Activity bar inactive icon not found:', iconId);
                            }
                        });
                        
                        // Update active border example - CRITICAL FIX
                        const activeBorder = document.getElementById('activityBorder');
                        if (activeBorder) {
                            const borderColor = getElementValue('activityBarActiveBorder', '#007acc');
                            
                            // Enhanced border styling to make it more visible
                            activeBorder.style.setProperty('background-color', borderColor, 'important');
                            activeBorder.style.setProperty('width', '3px', 'important');
                            activeBorder.style.setProperty('height', '32px', 'important');
                            activeBorder.style.setProperty('position', 'absolute', 'important');
                            activeBorder.style.setProperty('left', '0', 'important');
                            activeBorder.style.setProperty('top', '50px', 'important'); // Align with active icon
                            activeBorder.style.setProperty('border-radius', '0 2px 2px 0', 'important');
                            activeBorder.style.setProperty('z-index', '10', 'important');
                            activeBorder.style.setProperty('box-shadow', '2px 0 4px rgba(0,0,0,0.3)', 'important');
                            
                            console.log('Activity bar active border updated:', borderColor);
                        } else {
                            console.warn('Activity bar active border element not found!');
                        }
                        
                        // Force a repaint by briefly hiding and showing the container
                        const container = document.getElementById('activitybarSectionPreview');
                        if (container) {
                            container.style.opacity = '0.99';
                            setTimeout(() => {
                                container.style.opacity = '1';
                            }, 1);
                        }
                    }
                    
                    function updateSideBarSectionPreview() {
                        // Update sidebar section preview
                        const sidebar = document.getElementById('mockupSidebar');
                        if (sidebar) {
                            sidebar.style.backgroundColor = getElementValue('sideBarBackground', '#252526');
                            sidebar.style.color = getElementValue('sideBarForeground', '#cccccc');
                        }
                        
                        // Update sidebar border example
                        const borderExample = document.getElementById('sidebarBorderExample');
                        if (borderExample) {
                            const borderColor = getElementValue('sideBarBorder', '#2d2d30');
                            borderExample.style.borderTop = '2px solid ' + borderColor;
                            borderExample.style.color = getElementValue('sideBarForeground', '#cccccc');
                            borderExample.style.backgroundColor = getElementValue('sideBarBackground', '#252526');
                            borderExample.style.padding = '5px';
                            borderExample.style.textAlign = 'center';
                            borderExample.style.fontSize = '11px';
                        }
                        
                        // Update other sidebar items
                        updateMockupElement('sidebarActiveItem', 'sideBarBackground', 'sideBarForeground');
                        updateElementBgColor('sidebarHoverItem', 'listHover', '#2a2d2e');
                        updateElementBgColor('sidebarFocusItem', 'listActiveSelection', '#264f78');
                    }
                    
                    function updateSidebarHeadersSectionPreview() {
                        console.log('Updating sidebar section headers preview...');
                        
                        // Update section headers
                        const sectionHeader1 = document.getElementById('sectionHeaderPreview');
                        if (sectionHeader1) {
                            const headerBgColor = getElementValue('sideBarSectionHeaderBackground', '#252526');
                            const headerFgColor = getElementValue('sideBarSectionHeaderForeground', '#cccccc');
                            const headerBorderColor = getElementValue('sideBarSectionHeaderBorder', '#2d2d30');
                            sectionHeader1.style.backgroundColor = headerBgColor;
                            sectionHeader1.style.color = headerFgColor;
                            sectionHeader1.style.borderBottom = '1px solid ' + headerBorderColor;
                            console.log('Section header 1 updated:', { headerBgColor, headerFgColor, headerBorderColor });
                        }
                        
                        const sectionHeader2 = document.getElementById('sectionHeaderPreview2');
                        if (sectionHeader2) {
                            const headerBgColor = getElementValue('sideBarSectionHeaderBackground', '#252526');
                            const headerFgColor = getElementValue('sideBarSectionHeaderForeground', '#cccccc');
                            const headerBorderColor = getElementValue('sideBarSectionHeaderBorder', '#2d2d30');
                            sectionHeader2.style.backgroundColor = headerBgColor;
                            sectionHeader2.style.color = headerFgColor;
                            sectionHeader2.style.borderBottom = '1px solid ' + headerBorderColor;
                            console.log('Section header 2 updated:', { headerBgColor, headerFgColor, headerBorderColor });
                        }
                        
                        // Update the mockup container
                        const mockupContainer = document.getElementById('mockupSidebarHeaders');
                        if (mockupContainer) {
                            const borderColor = getElementValue('sideBarSectionHeaderBorder', '#2d2d30');
                            mockupContainer.style.borderColor = borderColor;
                        }
                    }
                    
                    function updateStatusBarSectionPreview() {
                        console.log('Updating status bar preview...');
                        
                        // Update normal status bar
                        const normalStatusBar = document.getElementById('mockupStatusbar');
                        if (normalStatusBar) {
                            const bgColor = getElementValue('statusBarBackground', '#007acc');
                            const fgColor = getElementValue('statusBarForeground', '#ffffff');
                            normalStatusBar.style.backgroundColor = bgColor;
                            normalStatusBar.style.color = fgColor;
                            console.log('Normal status bar updated:', { bgColor, fgColor });
                        }
                        
                        // Update debug status bar - CRITICAL FIX
                        const debugStatusBar = document.getElementById('mockupStatusbarDebug');
                        if (debugStatusBar) {
                            const debugBgColor = getElementValue('statusBarDebuggingBackground', '#cc6633');
                            const debugFgColor = getElementValue('statusBarForeground', '#ffffff');
                            debugStatusBar.style.backgroundColor = debugBgColor;
                            debugStatusBar.style.color = debugFgColor;
                            debugStatusBar.style.border = '1px solid ' + debugBgColor;
                            console.log('Debug status bar updated:', { debugBgColor, debugFgColor });
                        } else {
                            console.warn('Debug status bar element not found!');
                        }
                    }
                    
                    function updateTabsSectionPreview() {
                        // Update tab bar background
                        const tabContainer = document.getElementById('mockupTabs');
                        if (tabContainer) {
                            const bgColor = getElementValue('editorGroupHeaderTabsBackground', '#252526');
                            tabContainer.style.backgroundColor = bgColor;
                            console.log('Tab bar background updated:', bgColor);
                        }
                        
                        // Update tabs section preview
                        updateMockupElement('activeTab', 'tabActiveBackground', 'tabActiveForeground');
                        updateMockupElement('inactiveTab', 'tabInactiveBackground', 'tabInactiveForeground');
                        updateMockupElement('hoverTab', 'tabInactiveBackground', 'tabInactiveForeground');
                        updateElementColor('activeTabBorder', 'tabActiveBorder', '#007acc');
                    }
                    
                    function updatePanelTabsSectionPreview() {
                        console.log('Updating panel tabs preview...');
                        
                        // Update panel tabs container background
                        const panelTabsContainer = document.getElementById('mockupPanelTabs');
                        if (panelTabsContainer) {
                            const bgColor = getElementValue('panelTitleBackground', '#252526');
                            panelTabsContainer.style.backgroundColor = bgColor;
                            console.log('Panel tabs background updated:', bgColor);
                        }
                        
                        // Update active panel tab
                        const activePanelTab = document.getElementById('activePanelTab');
                        if (activePanelTab) {
                            const activeFgColor = getElementValue('panelTitleActiveForeground', '#ffffff');
                            activePanelTab.style.color = activeFgColor;
                            console.log('Active panel tab updated:', activeFgColor);
                        }
                        
                        // Update active panel tab border
                        const activePanelTabBorder = document.getElementById('activePanelTabBorder');
                        if (activePanelTabBorder) {
                            const activeBorderColor = getElementValue('panelTitleActiveBorder', '#007acc');
                            activePanelTabBorder.style.backgroundColor = activeBorderColor;
                            console.log('Active panel tab border updated:', activeBorderColor);
                        }
                        
                        // Update inactive panel tabs
                        const inactivePanelTabs = ['inactivePanelTab1', 'inactivePanelTab2', 'inactivePanelTab3', 'inactivePanelTab4'];
                        const inactiveFgColor = getElementValue('panelTitleInactiveForeground', '#cccccc80');
                        
                        inactivePanelTabs.forEach(tabId => {
                            const tab = document.getElementById(tabId);
                            if (tab) {
                                tab.style.color = inactiveFgColor;
                                console.log('Inactive panel tab ' + tabId + ' updated:', inactiveFgColor);
                            }
                        });
                    }
                    
                    function updateSyntaxSectionPreview() {
                        // Update syntax highlighting in section preview
                        updateSyntaxHighlighting();
                    }
                    
                    function updateUIControlsSectionPreview() {
                        // Update UI controls section preview
                        updateButtonElement('previewButtonPrimary', 'buttonPrimaryBackground', 'buttonPrimaryForeground', '#0e639c', '#ffffff');
                        updateButtonElement('previewButtonSecondary', 'buttonSecondaryBackground', 'buttonSecondaryForeground', '#5f6a79', '#ffffff');
                        updateButtonElement('previewButtonHover', 'buttonPrimaryBackground', 'buttonPrimaryForeground', '#1177bb', '#ffffff');
                        
                        // Update inputs
                        updateInputElement('previewInput', 'inputBackground', 'inputForeground', 'inputBackground', '#3c3c3c', '#cccccc');
                        updateInputElement('previewDropdown', 'inputBackground', 'inputForeground', 'inputBackground', '#3c3c3c', '#cccccc');
                        
                        // Update list items
                        updateListElement('listItemActive', 'listActiveSelection', 'inputForeground', '#094771', '#ffffff');
                        updateListElement('listItemInactive', 'inputBackground', 'inputForeground', '#37373d', '#cccccc');
                        updateListElement('listItemHover', 'listHover', 'inputForeground', '#2a2d2e', '#ffffff');
                        updateListElement('listItemFocus', 'listActiveSelection', 'inputForeground', '#094771', '#ffffff');
                        
                        // Update progress and badge
                        updateElementColor('previewProgressBar', 'progressBarColor', '#007acc');
                        updateButtonElement('previewBadge', 'badgeBackground', 'inputForeground', '#007acc', '#ffffff');
                    }
                    
                    function updateTitleBarSectionPreview() {
                        console.log('Updating title bar preview...');
                        
                        // Update active title bar
                        const activeTitleBar = document.getElementById('mockupTitlebarActive');
                        if (activeTitleBar) {
                            const activeBgColor = getElementValue('titleBarActiveBackground', '#3c3c3c');
                            const activeFgColor = getElementValue('titleBarActiveForeground', '#cccccc');
                            activeTitleBar.style.backgroundColor = activeBgColor;
                            activeTitleBar.style.color = activeFgColor;
                            console.log('Active title bar updated:', { activeBgColor, activeFgColor });
                        }
                        
                        // Update inactive title bar
                        const inactiveTitleBar = document.getElementById('mockupTitlebarInactive');
                        if (inactiveTitleBar) {
                            const inactiveBgColor = getElementValue('titleBarInactiveBackground', '#3c3c3c');
                            const inactiveFgColor = getElementValue('titleBarInactiveForeground', '#cccccc');
                            inactiveTitleBar.style.backgroundColor = inactiveBgColor;
                            inactiveTitleBar.style.color = inactiveFgColor;
                            console.log('Inactive title bar updated:', { inactiveBgColor, inactiveFgColor });
                        }
                    }
                    
                    function updatePanelSectionPreview() {
                        console.log('Updating panel preview...');
                        
                        // Update panel background
                        const panelContent = document.getElementById('panelContent');
                        if (panelContent) {
                            const bgColor = getElementValue('panelBackground', '#252526');
                            panelContent.style.backgroundColor = bgColor;
                            console.log('Panel content background updated:', bgColor);
                        }
                        
                        // Update panel border example
                        const panelBorderExample = document.getElementById('panelBorderExample');
                        if (panelBorderExample) {
                            const borderColor = getElementValue('panelBorder', '#2d2d30');
                            panelBorderExample.style.borderColor = borderColor;
                            panelBorderExample.style.color = getElementValue('titleBarActiveForeground', '#cccccc');
                            console.log('Panel border example updated:', borderColor);
                        }
                        
                        // Update panel drop border example
                        const panelDropBorderExample = document.getElementById('panelDropBorderExample');
                        if (panelDropBorderExample) {
                            const dropBorderColor = getElementValue('panelDropBorder', '#007acc');
                            panelDropBorderExample.style.borderColor = dropBorderColor;
                            panelDropBorderExample.style.color = dropBorderColor;
                            panelDropBorderExample.style.backgroundColor = dropBorderColor + '20'; // Add transparency
                            console.log('Panel drop border example updated:', dropBorderColor);
                        }
                        
                        // Update panel container
                        const mockupPanel = document.getElementById('mockupPanel');
                        if (mockupPanel) {
                            const bgColor = getElementValue('panelBackground', '#252526');
                            const borderColor = getElementValue('panelBorder', '#2d2d30');
                            mockupPanel.style.backgroundColor = bgColor;
                            mockupPanel.style.borderColor = borderColor;
                            console.log('Panel container updated:', { bgColor, borderColor });
                        }
                    }
                    
                    function updateListTreeSectionPreview() {
                        console.log('Updating list & tree preview...');
                        
                        // Update active selection
                        const activeSelection = document.getElementById('listActiveSelectionPreview');
                        if (activeSelection) {
                            const activeBgColor = getElementValue('listActiveSelectionBackground', '#094771');
                            const activeFgColor = getElementValue('listActiveSelectionForeground', '#ffffff');
                            activeSelection.style.backgroundColor = activeBgColor;
                            activeSelection.style.color = activeFgColor;
                            console.log('List active selection updated:', { activeBgColor, activeFgColor });
                        }
                        
                        // Update inactive selection
                        const inactiveSelection = document.getElementById('listInactiveSelectionPreview');
                        if (inactiveSelection) {
                            const inactiveBgColor = getElementValue('listInactiveSelectionBackground', '#37373d');
                            const inactiveFgColor = getElementValue('listInactiveSelectionForeground', '#cccccc');
                            inactiveSelection.style.backgroundColor = inactiveBgColor;
                            inactiveSelection.style.color = inactiveFgColor;
                            console.log('List inactive selection updated:', { inactiveBgColor, inactiveFgColor });
                        }
                        
                        // Update hover item
                        const hoverItem = document.getElementById('listHoverPreview');
                        if (hoverItem) {
                            const hoverBgColor = getElementValue('listHoverBackground', '#2a2d2e');
                            const hoverFgColor = getElementValue('listHoverForeground', '#ffffff');
                            hoverItem.style.backgroundColor = hoverBgColor;
                            hoverItem.style.color = hoverFgColor;
                            console.log('List hover item updated:', { hoverBgColor, hoverFgColor });
                        }
                        
                        // Update focus item
                        const focusItem = document.getElementById('listFocusPreview');
                        if (focusItem) {
                            const focusBgColor = getElementValue('listFocusBackground', '#094771');
                            const focusFgColor = getElementValue('listFocusForeground', '#ffffff');
                            focusItem.style.backgroundColor = focusBgColor;
                            focusItem.style.color = focusFgColor;
                            console.log('List focus item updated:', { focusBgColor, focusFgColor });
                        }
                    }
                    
                    function updateScrollbarSectionPreview() {
                        console.log('Updating scrollbar preview...');
                        
                        // Update scrollbar shadow
                        const scrollbarShadow = document.getElementById('scrollbarShadowPreview');
                        if (scrollbarShadow) {
                            const shadowColor = getElementValue('scrollbarShadow', '#1e1e1e80');
                            scrollbarShadow.style.backgroundColor = shadowColor;
                            scrollbarShadow.style.color = '#cccccc';
                            console.log('Scrollbar shadow updated:', shadowColor);
                        }
                    }

                    function updateScrollbarElementsPreview() {
                        console.log('Updating scrollbar elements preview...');
                        
                        // Update breadcrumb background
                        const breadcrumbPreview = document.getElementById('breadcrumbPreview');
                        if (breadcrumbPreview) {
                            const breadcrumbBg = getElementValue('breadcrumbBackground', '#1e1e1e');
                            breadcrumbPreview.style.backgroundColor = breadcrumbBg;
                            console.log('Breadcrumb background updated:', breadcrumbBg);
                        }
                        
                        // Update editor gutter background
                        const gutterPreview = document.getElementById('gutterPreview');
                        if (gutterPreview) {
                            const gutterBg = getElementValue('editorGutterBackground', '#1e1e1e');
                            gutterPreview.style.backgroundColor = gutterBg;
                            console.log('Editor gutter background updated:', gutterBg);
                        }
                        
                        // Update scrollbar sliders with proper color handling
                        const scrollbarSliderNormal = document.getElementById('scrollbarSliderNormal');
                        if (scrollbarSliderNormal) {
                            let sliderBg = getElementValue('scrollbarSliderBackground', '#797979');
                            // If the color comes with alpha from preset, use it directly
                            scrollbarSliderNormal.style.backgroundColor = sliderBg;
                            console.log('Scrollbar slider normal updated:', sliderBg);
                        }
                        
                        const scrollbarSliderHover = document.getElementById('scrollbarSliderHover');
                        if (scrollbarSliderHover) {
                            let sliderHoverBg = getElementValue('scrollbarSliderHoverBackground', '#646464');
                            // If the color comes with alpha from preset, use it directly
                            scrollbarSliderHover.style.backgroundColor = sliderHoverBg;
                            console.log('Scrollbar slider hover updated:', sliderHoverBg);
                        }
                        
                        const scrollbarSliderActive = document.getElementById('scrollbarSliderActive');
                        if (scrollbarSliderActive) {
                            let sliderActiveBg = getElementValue('scrollbarSliderActiveBackground', '#bfbfbf');
                            // If the color comes with alpha from preset, use it directly
                            scrollbarSliderActive.style.backgroundColor = sliderActiveBg;
                            console.log('Scrollbar slider active updated:', sliderActiveBg);
                        }
                        
                        // Update minimap background
                        const minimapPreview = document.getElementById('minimapPreview');
                        if (minimapPreview) {
                            const minimapBg = getElementValue('minimapBackground', '#1e1e1e');
                            minimapPreview.style.backgroundColor = minimapBg;
                            console.log('Minimap background updated:', minimapBg);
                        }
                        
                        // Update minimap slider with dynamic transparency
                        const minimapSliderPreview = document.getElementById('minimapSliderPreview');
                        if (minimapSliderPreview) {
                            // Get base color - if it already has alpha, strip it
                            let baseColor = getElementValue('minimapSliderBackground', '#797979');
                            if (baseColor.length === 9) {
                                baseColor = baseColor.substring(0, 7); // Strip alpha if present
                            }
                            
                            const transparency = getElementValue('minimapSliderTransparency', '60');
                            const alpha = Math.round((parseInt(transparency) / 100) * 255).toString(16).padStart(2, '0');
                            const colorWithAlpha = baseColor + alpha;
                            minimapSliderPreview.style.backgroundColor = colorWithAlpha;
                            console.log('Minimap slider updated with transparency:', colorWithAlpha, transparency + '%');
                            
                            // Add hover effect showing different transparency
                            let hoverBaseColor = getElementValue('minimapSliderHoverBackground', '#646464');
                            if (hoverBaseColor.length === 9) {
                                hoverBaseColor = hoverBaseColor.substring(0, 7); // Strip alpha if present
                            }
                            
                            const hoverTransparency = getElementValue('minimapSliderHoverTransparency', '80');
                            const hoverAlpha = Math.round((parseInt(hoverTransparency) / 100) * 255).toString(16).padStart(2, '0');
                            const hoverColorWithAlpha = hoverBaseColor + hoverAlpha;
                            
                            minimapSliderPreview.onmouseenter = function() {
                                this.style.backgroundColor = hoverColorWithAlpha;
                            };
                            minimapSliderPreview.onmouseleave = function() {
                                this.style.backgroundColor = colorWithAlpha;
                            };
                        }
                        
                        // Update additional minimap slider preview squares for hover and active states
                        const minimapSliderHoverPreview = document.getElementById('minimapSliderHoverPreview');
                        if (minimapSliderHoverPreview) {
                            let hoverBaseColor = getElementValue('minimapSliderHoverBackground', '#646464');
                            if (hoverBaseColor.length === 9) {
                                hoverBaseColor = hoverBaseColor.substring(0, 7);
                            }
                            const hoverTransparency = getElementValue('minimapSliderHoverTransparency', '80');
                            const hoverAlpha = Math.round((parseInt(hoverTransparency) / 100) * 255).toString(16).padStart(2, '0');
                            minimapSliderHoverPreview.style.backgroundColor = hoverBaseColor + hoverAlpha;
                        }
                        
                        const minimapSliderActivePreview = document.getElementById('minimapSliderActivePreview');
                        if (minimapSliderActivePreview) {
                            let activeBaseColor = getElementValue('minimapSliderActiveBackground', '#bfbfbf');
                            if (activeBaseColor.length === 9) {
                                activeBaseColor = activeBaseColor.substring(0, 7);
                            }
                            const activeTransparency = getElementValue('minimapSliderActiveTransparency', '100');
                            const activeAlpha = Math.round((parseInt(activeTransparency) / 100) * 255).toString(16).padStart(2, '0');
                            minimapSliderActivePreview.style.backgroundColor = activeBaseColor + activeAlpha;
                        }
                    }
                    
                    function updateElementColor(elementId, inputId, defaultColor) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            const color = getElementValue(inputId, defaultColor);
                            element.style.backgroundColor = color;
                        }
                    }
                    
                    function updateElementBgColor(elementId, inputId, defaultColor) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            const color = getElementValue(inputId, defaultColor);
                            element.style.backgroundColor = color;
                        }
                    }
                    

                    
                    function updateButtonElement(elementId, bgInputId, fgInputId, defaultBg, defaultFg) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.style.backgroundColor = getElementValue(bgInputId, defaultBg);
                            element.style.color = getElementValue(fgInputId, defaultFg);
                        }
                    }
                    
                    function updateInputElement(elementId, bgInputId, fgInputId, borderInputId, defaultBg, defaultFg) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.style.backgroundColor = getElementValue(bgInputId, defaultBg);
                            element.style.color = getElementValue(fgInputId, defaultFg);
                            element.style.borderColor = getElementValue(borderInputId, defaultBg);
                        }
                    }
                    
                    function updateCheckboxElement(elementId, bgInputId, fgInputId, defaultBg, defaultFg) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.style.color = getElementValue(fgInputId, defaultFg);
                            const checkbox = element.querySelector('input');
                            if (checkbox) {
                                checkbox.style.backgroundColor = getElementValue(bgInputId, defaultBg);
                            }
                        }
                    }
                    
                    function updateListElement(elementId, bgInputId, fgInputId, defaultBg, defaultFg) {
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.style.backgroundColor = getElementValue(bgInputId, defaultBg);
                            element.style.color = getElementValue(fgInputId, defaultFg);
                        }
                    }
                    
                    function updateMockupElement(elementId, bgInputId, fgInputId, defaultBg, defaultFg) {
                        const element = document.getElementById(elementId);
                        if (!element) return;
                        
                        let bgColor = defaultBg;
                        let fgColor = defaultFg;
                        
                        if (bgInputId) {
                            const bgInput = document.getElementById(bgInputId);
                            if (bgInput) bgColor = bgInput.value;
                        }
                        
                        if (fgInputId) {
                            const fgInput = document.getElementById(fgInputId);
                            if (fgInput) fgColor = fgInput.value;
                        }
                        
                        if (bgColor) element.style.backgroundColor = bgColor;
                        if (fgColor) element.style.color = fgColor;
                    }
                    
                    function updateSyntaxHighlighting() {
                        const syntaxMap = {
                            'code-comment': { inputId: 'syntaxComment', defaultColor: '#6a9955' },
                            'code-keyword': { inputId: 'syntaxKeyword', defaultColor: '#569cd6' }, 
                            'code-string': { inputId: 'syntaxString', defaultColor: '#ce9178' },
                            'code-number': { inputId: 'syntaxNumber', defaultColor: '#b5cea8' },
                            'code-function': { inputId: 'syntaxFunction', defaultColor: '#dcdcaa' },
                            'code-variable': { inputId: 'syntaxVariable', defaultColor: '#9cdcfe' },
                            'code-type': { inputId: 'syntaxType', defaultColor: '#4ec9b0' },
                            'code-class': { inputId: 'syntaxClass', defaultColor: '#4ec9b0' }
                        };
                        
                        Object.entries(syntaxMap).forEach(([className, config]) => {
                            const color = getElementValue(config.inputId, config.defaultColor);
                            const elements = document.querySelectorAll('.' + className);
                            elements.forEach(element => {
                                element.style.color = color;
                            });
                        });
                    }
                    
                    // Listen for messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'presets':
                                populatePresets(message.data);
                                break;
                            case 'themeUpdate':
                                loadTheme(message.data);
                                break;
                        }
                    });
                    
                    function populatePresets(presets) {
                        const select = document.getElementById('presetSelect');
                        select.innerHTML = '<option value="">Choose a preset...</option>';
                        
                        presets.forEach(preset => {
                            const option = document.createElement('option');
                            option.value = preset.id;
                            option.textContent = preset.name + ' - ' + preset.description;
                            select.appendChild(option);
                        });
                        
                        select.addEventListener('change', function() {
                            if (this.value) {
                                const preset = presets.find(p => p.id === this.value);
                                if (preset) {
                                    loadTheme(preset.theme);
                                    updateLivePreview();
                                }
                            }
                        });
                    }
                    
                    function loadTheme(theme) {
                        if (!theme) return;
                        
                        console.log('Loading theme:', theme.name, 'with editor theme:', !!theme.editorTheme);
                        
                        // Load terminal values
                        const setInputValue = (id, value) => {
                            const input = document.getElementById(id);
                            if (input && value !== undefined) input.value = value;
                        };
                        
                        setInputValue('backgroundColor', theme.colors?.background || '#000000');
                        setInputValue('foregroundColor', theme.colors?.foreground || '#ffffff');
                        setInputValue('cursorColor', theme.cursor?.color || '#ffffff');
                        setInputValue('selectionColor', (theme.colors?.selection || '#ffffff').replace(/[0-9a-fA-F]{2}$/, ''));
                        setInputValue('fontSize', theme.font?.size || 14);
                        
                        // Load editor theme settings if available
                        if (theme.editorTheme) {
                            console.log('Loading editor theme data...');
                            // Load editor core colors
                            
                            setInputValue('editorBackground', theme.editorTheme.editor?.background || '#1e1e1e');
                            setInputValue('editorForeground', theme.editorTheme.editor?.foreground || '#d4d4d4');
                            setInputValue('editorSelectionBackground', theme.editorTheme.editor?.selectionBackground || '#264f78');
                            setInputValue('editorLineHighlight', theme.editorTheme.editor?.lineHighlightBackground || '#2a2d2e');
                            setInputValue('editorCursor', theme.editorTheme.editor?.cursorColor || '#ffffff');
                            setInputValue('editorIndentGuide', theme.editorTheme.editor?.indentGuideBackground || '#404040');
                            
                            // Load activity bar colors
                            setInputValue('activityBarBackground', theme.editorTheme.activityBar?.background || '#333333');
                            setInputValue('activityBarForeground', theme.editorTheme.activityBar?.foreground || '#ffffff');
                            setInputValue('activityBarInactiveForeground', theme.editorTheme.activityBar?.inactiveForeground || '#ffffff66');
                            setInputValue('activityBarActiveBorder', theme.editorTheme.activityBar?.activeBorder || '#007acc');
                            
                            // Load side bar colors
                            setInputValue('sideBarBackground', theme.editorTheme.sideBar?.background || '#252526');
                            setInputValue('sideBarForeground', theme.editorTheme.sideBar?.foreground || '#cccccc');
                            setInputValue('sideBarBorder', theme.editorTheme.sideBar?.border || '#2d2d30');
                            
                            // Load sidebar section header colors
                            setInputValue('sideBarSectionHeaderBackground', theme.editorTheme.sideBarSectionHeader?.background || '#252526');
                            setInputValue('sideBarSectionHeaderForeground', theme.editorTheme.sideBarSectionHeader?.foreground || '#cccccc');
                            setInputValue('sideBarSectionHeaderBorder', theme.editorTheme.sideBarSectionHeader?.border || '#2d2d30');
                            
                            // Load status bar colors
                            setInputValue('statusBarBackground', theme.editorTheme.statusBar?.background || '#007acc');
                            setInputValue('statusBarForeground', theme.editorTheme.statusBar?.foreground || '#ffffff');
                            setInputValue('statusBarDebuggingBackground', theme.editorTheme.statusBar?.debuggingBackground || '#cc6633');
                            
                            // Load tab colors
                            setInputValue('tabActiveBackground', theme.editorTheme.tab?.activeBackground || '#1e1e1e');
                            setInputValue('tabActiveForeground', theme.editorTheme.tab?.activeForeground || '#ffffff');
                            setInputValue('tabInactiveBackground', theme.editorTheme.tab?.inactiveBackground || '#2d2d30');
                            setInputValue('tabInactiveForeground', theme.editorTheme.tab?.inactiveForeground || '#cccccc80');
                            setInputValue('tabActiveBorder', theme.editorTheme.tab?.activeBorder || '#007acc');
                            
                            // Load syntax colors
                            setInputValue('syntaxComment', theme.editorTheme.syntax?.comment || '#6a9955');
                            setInputValue('syntaxKeyword', theme.editorTheme.syntax?.keyword || '#569cd6');
                            setInputValue('syntaxString', theme.editorTheme.syntax?.string || '#ce9178');
                            setInputValue('syntaxNumber', theme.editorTheme.syntax?.number || '#b5cea8');
                            setInputValue('syntaxFunction', theme.editorTheme.syntax?.function || '#dcdcaa');
                            setInputValue('syntaxVariable', theme.editorTheme.syntax?.variable || '#9cdcfe');
                            setInputValue('syntaxType', theme.editorTheme.syntax?.type || '#4ec9b0');
                            setInputValue('syntaxClass', theme.editorTheme.syntax?.class || '#4ec9b0');
                            
                            // Load title bar colors
                            setInputValue('titleBarActiveBackground', theme.editorTheme.titleBar?.activeBackground || '#3c3c3c');
                            setInputValue('titleBarActiveForeground', theme.editorTheme.titleBar?.activeForeground || '#cccccc');
                            setInputValue('titleBarInactiveBackground', theme.editorTheme.titleBar?.inactiveBackground || '#3c3c3c');
                            setInputValue('titleBarInactiveForeground', theme.editorTheme.titleBar?.inactiveForeground || '#cccccc');
                            
                            // Load list & tree colors
                            setInputValue('listActiveSelectionBackground', theme.editorTheme.list?.activeSelectionBackground || '#094771');
                            setInputValue('listActiveSelectionForeground', theme.editorTheme.list?.activeSelectionForeground || '#ffffff');
                            setInputValue('listInactiveSelectionBackground', theme.editorTheme.list?.inactiveSelectionBackground || '#37373d');
                            setInputValue('listInactiveSelectionForeground', theme.editorTheme.list?.inactiveSelectionForeground || '#cccccc');
                            setInputValue('listHoverBackground', theme.editorTheme.list?.hoverBackground || '#2a2d2e');
                            setInputValue('listHoverForeground', theme.editorTheme.list?.hoverForeground || '#ffffff');
                            setInputValue('listFocusBackground', theme.editorTheme.list?.focusBackground || '#094771');
                            setInputValue('listFocusForeground', theme.editorTheme.list?.focusForeground || '#ffffff');
                            
                            // Load UI controls colors
                            setInputValue('buttonPrimaryBackground', theme.editorTheme.button?.primaryBackground || '#0e639c');
                            setInputValue('buttonPrimaryForeground', theme.editorTheme.button?.primaryForeground || '#ffffff');
                            setInputValue('buttonSecondaryBackground', theme.editorTheme.button?.secondaryBackground || '#5f6a79');
                            setInputValue('buttonSecondaryForeground', theme.editorTheme.button?.secondaryForeground || '#ffffff');
                            setInputValue('inputBackground', theme.editorTheme.input?.background || '#3c3c3c');
                            setInputValue('inputForeground', theme.editorTheme.input?.foreground || '#cccccc');
                            setInputValue('inputBorder', theme.editorTheme.input?.border || '#2d2d30');
                            setInputValue('inputPlaceholder', theme.editorTheme.input?.placeholder || '#cccccc');
                            setInputValue('dropdownBackground', theme.editorTheme.dropdown?.background || '#3c3c3c');
                            setInputValue('dropdownForeground', theme.editorTheme.dropdown?.foreground || '#cccccc');
                            setInputValue('checkboxBackground', theme.editorTheme.checkbox?.background || '#3c3c3c');
                            setInputValue('checkboxBorder', theme.editorTheme.checkbox?.border || '#2d2d30');
                            setInputValue('progressBarColor', theme.editorTheme.progressBar?.color || '#0e639c');
                            setInputValue('badgeBackground', theme.editorTheme.badge?.background || '#007acc');
                            setInputValue('badgeForeground', theme.editorTheme.badge?.foreground || '#ffffff');
                            
                            // Load enhanced activity bar colors
                            setInputValue('activityBarActiveBackground', theme.editorTheme.activityBar?.activeBackground || '#1e1e1e');
                            setInputValue('activityBarBorder', theme.editorTheme.activityBar?.border || '#2d2d30');
                            
                            // Load enhanced status bar colors
                            setInputValue('statusBarBorder', theme.editorTheme.statusBar?.border || '#2d2d30');
                            setInputValue('statusBarDebuggingForeground', theme.editorTheme.statusBar?.debuggingForeground || '#ffffff');
                            setInputValue('statusBarNoFolderBackground', theme.editorTheme.statusBar?.noFolderBackground || '#68217a');
                            
                            // Load enhanced tab colors
                            setInputValue('editorGroupHeaderTabsBackground', theme.editorTheme.tab?.background || '#252526');
                            setInputValue('tabActiveBorderTop', theme.editorTheme.tab?.activeBorderTop || '#007acc');
                            setInputValue('tabInactiveModifiedBorder', theme.editorTheme.tab?.inactiveModifiedBorder || '#0e639c');
                            setInputValue('tabBorder', theme.editorTheme.tab?.border || '#2d2d30');
                            setInputValue('tabUnfocusedActiveBackground', theme.editorTheme.tab?.unfocusedActiveBackground || '#2d2d30');
                            setInputValue('tabUnfocusedActiveForeground', theme.editorTheme.tab?.unfocusedActiveForeground || '#cccccc');
                            setInputValue('tabUnfocusedInactiveBackground', theme.editorTheme.tab?.unfocusedInactiveBackground || '#2d2d30');
                            setInputValue('tabUnfocusedInactiveForeground', theme.editorTheme.tab?.unfocusedInactiveForeground || '#cccccc');
                            
                            // Load panel title colors
                            setInputValue('panelTitleBackground', theme.editorTheme.panelTitle?.background || '#252526');
                            setInputValue('panelTitleActiveForeground', theme.editorTheme.panelTitle?.activeForeground || '#ffffff');
                            setInputValue('panelTitleActiveBorder', theme.editorTheme.panelTitle?.activeBorder || '#007acc');
                            setInputValue('panelTitleInactiveForeground', theme.editorTheme.panelTitle?.inactiveForeground || '#cccccc80');
                            
                            // Load breadcrumb colors
                            setInputValue('breadcrumbBackground', theme.editorTheme.breadcrumb?.background || '#1e1e1e');
                            
                            // Load editor gutter colors
                            setInputValue('editorGutterBackground', theme.editorTheme.editorGutter?.background || '#1e1e1e');
                            
                            // Load scrollbar colors
                            setInputValue('scrollbarSliderBackground', theme.editorTheme.scrollbar?.sliderBackground || '#79797966');
                            setInputValue('scrollbarSliderHoverBackground', theme.editorTheme.scrollbar?.sliderHoverBackground || '#646464b3');
                            setInputValue('scrollbarSliderActiveBackground', theme.editorTheme.scrollbar?.sliderActiveBackground || '#bfbfbf66');
                            
                            // Load minimap colors
                            setInputValue('minimapBackground', theme.editorTheme.minimap?.background || '#1e1e1e');
                                                    // Handle minimap slider with transparency extraction
                        const minimapSliderBg = theme.editorTheme.minimap?.sliderBackground || '#79797960';
                        const minimapSliderHoverBg = theme.editorTheme.minimap?.sliderHoverBackground || '#64646480';
                        const minimapSliderActiveBg = theme.editorTheme.minimap?.sliderActiveBackground || '#bfbfbfff';
                        
                        // Extract base color and alpha for each state
                        const extractColorAndAlpha = (colorWithAlpha) => {
                            if (colorWithAlpha.length === 9) { // #rrggbbaa format
                                const baseColor = colorWithAlpha.substring(0, 7);
                                const alpha = colorWithAlpha.substring(7, 9);
                                const transparency = Math.round((parseInt(alpha, 16) / 255) * 100);
                                return { baseColor, transparency };
                            }
                            return { baseColor: colorWithAlpha, transparency: 100 };
                        };
                        
                        const sliderNormal = extractColorAndAlpha(minimapSliderBg);
                        const sliderHover = extractColorAndAlpha(minimapSliderHoverBg);
                        const sliderActive = extractColorAndAlpha(minimapSliderActiveBg);
                        
                        setInputValue('minimapSliderBackground', sliderNormal.baseColor);
                        setInputValue('minimapSliderTransparency', sliderNormal.transparency.toString());
                        setInputValue('minimapSliderHoverBackground', sliderHover.baseColor);
                        setInputValue('minimapSliderHoverTransparency', sliderHover.transparency.toString());
                        setInputValue('minimapSliderActiveBackground', sliderActive.baseColor);
                        setInputValue('minimapSliderActiveTransparency', sliderActive.transparency.toString());
                        
                        // Update transparency value displays
                        document.getElementById('minimapSliderTransparencyValue').textContent = sliderNormal.transparency + '%';
                        document.getElementById('minimapSliderHoverTransparencyValue').textContent = sliderHover.transparency + '%';
                        document.getElementById('minimapSliderActiveTransparencyValue').textContent = sliderActive.transparency + '%';
                        } else {
                            console.log('No editor theme data found in preset');
                        }
                        
                        updatePreview();
                    }
                </script>
            </body>
            </html>`;
  }

  private getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
