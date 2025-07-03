# TermiStyle 🎨

**Fully customize your VS Code integrated terminal theme with live preview, advanced color controls, and seamless theme management.**

## Features ✨

### 🖌️ Live Terminal Theme Preview

- Real-time preview of your changes as you customize colors and fonts
- Instant visual feedback for all adjustments
- Toggle live preview on/off for performance

### 🎨 Advanced Color Customization

- **Basic Colors**: Background, foreground, cursor, and selection colors
- **Full ANSI Color Support**: Customize all 16 ANSI colors (8 normal + 8 bright)
- **Tab Colors**: Active/inactive tab foreground and background
- **Border Colors**: Terminal border customization
- **Color Picker UI**: Easy-to-use color pickers for all color options

### 📝 Font Customization

- **Font Family**: Choose from system monospace fonts including:
  - Consolas, Monaco, Menlo, Courier New
  - Fira Code, JetBrains Mono, Cascadia Code (with ligature support)
  - Source Code Pro, SF Mono, Roboto Mono
- **Font Size**: Adjustable from 8px to 32px
- **Font Weight**: Light, Normal, Medium, Bold options
- **Font Ligatures**: Enable/disable programming ligatures
- **Line Height**: Fine-tune spacing between lines

### 💾 Theme Management

- **Save & Load**: Create and manage custom themes
- **Theme Library**: Built-in preset themes including:
  - Dark Terminal (Classic dark theme)
  - Light Terminal (Clean light theme)
  - Neon Glow (Futuristic cyberpunk theme)
  - Retro CRT (Vintage terminal aesthetic)
  - Ocean Breeze (Cool blue-themed palette)
- **Quick Theme Switching**: Rapidly switch between saved themes
- **Theme Backup & Restore**: Automatic backups before applying changes

### 🔄 Import/Export Support

- **TermiStyle Format**: Native .termistyle theme files
- **Cross-Platform Support**: Import/export themes from:
  - Windows Terminal (.json)
  - Alacritty (.yml)
  - iTerm2 (.itermcolors) [Planned]
  - Hyper.js (.js) [Planned]
  - Kitty (.conf) [Planned]

### 🌗 Auto Theme Switching

- **System Theme Detection**: Automatically switch themes based on OS dark/light mode
- **Time-Based Switching**: Configure different themes for day/night
- **Custom Schedule**: Set specific hours for light/dark theme switching

### ✨ Visual Effects & Integration

- **Transparency**: Adjustable terminal transparency (0-100%)
- **Blur Effects**: Add subtle blur for modern aesthetics
- **Glow Effects**: Matrix-style terminal glow
- **Scanlines**: Retro CRT monitor effect
- **Integration Options**:
  - Apply to Terminal only
  - Apply to Editor
  - Apply to entire VS Code Workbench

### 🎯 Advanced Features

- **Live Preview Toggle**: Enable/disable real-time updates
- **Settings Backup**: Automatic backup of VS Code settings before changes
- **Theme Validation**: JSON schema validation for theme files
- **Extensible Architecture**: Built for future enhancements

## Installation 📦

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "TermiStyle"
4. Click Install

Or install from the command line:

```bash
code --install-extension termistyle.termistyle
```

## Usage 🚀

### Quick Start

1. Open Command Palette (Ctrl+Shift+P)
2. Type "TermiStyle: Open Theme Customizer"
3. Start customizing your terminal theme!

### Available Commands

- **TermiStyle: Open Theme Customizer** - Open the main theme editor
- **TermiStyle: Quick Theme Switch** - Quickly switch between saved themes
- **TermiStyle: Import Theme** - Import theme from file
- **TermiStyle: Export Current Theme** - Export current theme to file
- **TermiStyle: Reset to Default Theme** - Reset all terminal settings
- **TermiStyle: Toggle Auto Theme Switch** - Enable/disable automatic switching

### Theme File Format

TermiStyle uses a comprehensive JSON format that includes:

```json
{
  "name": "My Custom Theme",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A beautiful custom terminal theme",
  "font": {
    "family": "Fira Code, monospace",
    "size": 14,
    "weight": "normal",
    "ligatures": true,
    "lineHeight": 1.2
  },
  "colors": {
    "background": "#1e1e1e",
    "foreground": "#d4d4d4",
    "ansiBlack": "#000000",
    "ansiRed": "#cd3131"
    // ... all 16 ANSI colors
  },
  "effects": {
    "transparency": 10,
    "glowEffect": true,
    "animations": true
  }
  // ... and more
}
```

## Configuration ⚙️

### Extension Settings

- `termistyle.autoSwitch.enabled` - Enable automatic theme switching
- `termistyle.autoSwitch.mode` - Auto-switch mode: "time" or "system"
- `termistyle.autoSwitch.lightTheme` - Light theme for auto-switching
- `termistyle.autoSwitch.darkTheme` - Dark theme for auto-switching
- `termistyle.livePreview.enabled` - Enable live preview by default
- `termistyle.backup.enabled` - Automatically backup settings before changes

### VS Code Integration

TermiStyle modifies these VS Code settings:

- `terminal.integrated.fontFamily`
- `terminal.integrated.fontSize`
- `terminal.integrated.fontWeight`
- `terminal.integrated.cursorStyle`
- `workbench.colorCustomizations` (terminal colors)

## Themes Gallery 🎭

### Built-in Presets

**Dark Terminal** - Classic dark professional theme

- Background: #1e1e1e
- Perfect for long coding sessions

**Light Terminal** - Clean, minimal light theme

- Background: #ffffff
- Great for daytime development

**Neon Glow** - Futuristic cyberpunk theme

- Matrix-style green glow effects
- Background: #0a0a0a with neon accents

**Retro CRT** - Vintage terminal experience

- Classic green-on-black with scanlines
- Authentic retro computing feel

**Ocean Breeze** - Modern blue-themed palette

- GitHub-inspired colors
- Cool, professional appearance

## Keyboard Shortcuts ⌨️

- `Ctrl+Shift+P` → "TermiStyle" - Access all commands
- Within Theme Customizer:
  - `Ctrl+S` - Save current theme
  - `Ctrl+R` - Reset to defaults
  - `Ctrl+E` - Export theme
  - `Ctrl+I` - Import theme

## Contributing 🤝

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/termistyle/termistyle.git
cd termistyle
npm install
npm run compile
```

## Roadmap 🗺️

### Upcoming Features

- [ ] More terminal format support (iTerm2, Hyper, Kitty)
- [ ] Theme sharing community
- [ ] Advanced animation effects
- [ ] Terminal background images
- [ ] Sound effects for typing
- [ ] Plugin system for custom effects
- [ ] Terminal opacity gradients
- [ ] Multi-monitor theme profiles

### Version History

- **1.0.0** - Initial release with core functionality
- **1.1.0** - Auto-switching and preset themes [Planned]
- **1.2.0** - Advanced effects and animations [Planned]

## Support 💬

- 📧 Email: support@termistyle.dev
- 🐛 Issues: [GitHub Issues](https://github.com/termistyle/termistyle/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/termistyle/termistyle/discussions)
- 📚 Wiki: [Documentation Wiki](https://github.com/termistyle/termistyle/wiki)

## License 📄

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- VS Code Terminal Team for the excellent terminal integration
- The terminal emulator community for inspiration
- Contributors and beta testers

---

**Made with ❤️ for the developer community**

Transform your terminal experience with TermiStyle! 🚀
