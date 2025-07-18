import { ThemePreset } from "./types";
import { corePresets } from "./presets/core-presets";
import { colorfulPresets } from "./presets/colorful-presets";
import { warmPresets } from "./presets/warm-presets";
import { naturePresets } from "./presets/nature-presets";
import { gothicPresets } from "./presets/gothic-presets";
import { neonPresets } from "./presets/neon-presets";
import { retroPresets } from "./presets/retro-presets";
import { cyberpunkPresets } from "./presets/cyberpunk-presets";

export class PresetManager {
  private presets: ThemePreset[] = [];

  constructor() {
    this.initializePresets();
  }

  getPresets(): ThemePreset[] {
    return this.presets;
  }

  getPresetsByCategory(category: string): ThemePreset[] {
    return this.presets.filter((preset) => preset.category === category);
  }

  getPresetById(id: string): ThemePreset | undefined {
    return this.presets.find((preset) => preset.id === id);
  }

  private initializePresets() {
    this.presets = [
      ...corePresets,
      ...colorfulPresets,
      ...warmPresets,
      ...naturePresets,
      ...gothicPresets,
      ...neonPresets,
      ...retroPresets,
      ...cyberpunkPresets,
    ];
  }
}
