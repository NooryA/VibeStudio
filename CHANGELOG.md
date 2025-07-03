# Changelog

All notable changes to the TermiStyle extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-15

### Added

- 🎨 **Theme Customizer** - Interactive webview for customizing terminal themes
- 🖌️ **Live Preview** - Real-time preview of theme changes
- 🎯 **Color Customization** - Full control over terminal colors including:
  - Background and foreground colors
  - All 16 ANSI colors (8 normal + 8 bright)
  - Cursor color and style
  - Selection colors
  - Tab colors
  - Border colors
- 📝 **Font Settings** - Comprehensive font customization:
  - Font family selection with system font detection
  - Font size (8-32px)
  - Font weight options
  - Font ligatures support
  - Line height adjustment
- 💾 **Theme Management** - Save, load, and manage custom themes
- 🎭 **Preset Themes** - Built-in themes including:
  - Dark Terminal (Classic dark)
  - Light Terminal (Clean light)
  - Neon Glow (Cyberpunk style)
  - Retro CRT (Vintage terminal)
  - Ocean Breeze (Modern blue palette)
- 🔄 **Import/Export** - Support for multiple formats:
  - TermiStyle native format (.termistyle)
  - Windows Terminal (.json)
  - Alacritty (.yml)
- 🌗 **Auto Theme Switching** - Automatic switching between themes:
  - System theme detection
  - Time-based switching
  - Configurable schedules
- ✨ **Visual Effects** - Special terminal effects:
  - Transparency control
  - Blur effects
  - Glow effects
  - Scanlines
  - CRT effects
- 🎯 **Integration Options** - Apply themes to:
  - Terminal only
  - Editor
  - Entire VS Code workbench
- 🔧 **Advanced Features**:
  - Settings backup and restore
  - Theme validation with JSON schema
  - Quick theme switching command
  - Welcome tour for new users

### Commands Added

- `TermiStyle: Open Theme Customizer` - Open the main theme editor
- `TermiStyle: Quick Theme Switch` - Quickly switch between saved themes
- `TermiStyle: Import Theme` - Import theme from file
- `TermiStyle: Export Current Theme` - Export current theme to file
- `TermiStyle: Reset to Default Theme` - Reset all terminal settings
- `TermiStyle: Toggle Auto Theme Switch` - Enable/disable automatic switching

### Configuration Added

- `termistyle.autoSwitch.enabled` - Enable automatic theme switching
- `termistyle.autoSwitch.mode` - Auto-switch mode: "time" or "system"
- `termistyle.autoSwitch.lightTheme` - Light theme for auto-switching
- `termistyle.autoSwitch.darkTheme` - Dark theme for auto-switching
- `termistyle.autoSwitch.lightHour` - Hour to switch to light theme
- `termistyle.autoSwitch.darkHour` - Hour to switch to dark theme
- `termistyle.presets.enabled` - Show preset themes in customizer
- `termistyle.livePreview.enabled` - Enable live preview by default
- `termistyle.backup.enabled` - Automatically backup settings before changes

### Technical Features

- TypeScript implementation with full type safety
- Modular architecture with separate managers for themes, presets, auto-switching, and export
- JSON schema validation for theme files
- Language support for .termistyle files
- Comprehensive error handling and user feedback
- Performance optimizations for live preview
- Memory-efficient theme storage and management

## [Unreleased]

### Planned for 1.1.0

- [ ] Additional terminal format support (iTerm2, Hyper, Kitty)
- [ ] Advanced animation system
- [ ] Terminal background image support
- [ ] Enhanced CRT effects with customizable parameters
- [ ] Theme sharing and community features
- [ ] Improved auto-detection of system fonts
- [ ] Performance optimizations for large theme collections

### Planned for 1.2.0

- [ ] Plugin system for custom effects
- [ ] Sound effects integration
- [ ] Multi-monitor theme profiles
- [ ] Terminal opacity gradients
- [ ] Advanced color palette generators
- [ ] Accessibility improvements and high contrast themes
- [ ] Integration with external color palette tools

## Known Issues

- Live preview may have slight delay on slower systems
- Some font ligatures may not display correctly in preview
- Auto theme switching requires VS Code restart in some cases
- Export to some formats may lose certain advanced effects

## Migration Guide

### From Manual Terminal Customization

If you were manually customizing terminal colors in VS Code settings:

1. Open TermiStyle Theme Customizer
2. Your current settings will be automatically detected
3. Save them as a custom theme for future use
4. Use the backup feature to preserve your original settings

### Breaking Changes

None in this initial release.

---

For more details about each release, visit our [GitHub Releases](https://github.com/termistyle/termistyle/releases) page.
