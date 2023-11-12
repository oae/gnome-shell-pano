import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { SettingsMenu } from '@pano/components/indicator/settingsMenu';
import { addToStatusArea } from '@pano/utils/ui';

export default class PanoIndicator {
  private indicatorChangeSignalId: number | null;
  private settingsMenu: SettingsMenu | null;
  private extension: ExtensionBase;
  private onClear: () => Promise<void>;
  private onToggle: () => void;

  constructor(ext: ExtensionBase, onClear: () => Promise<void>, onToggle: () => void) {
    this.extension = ext;
    this.onClear = onClear;
    this.onToggle = onToggle;
  }

  private createIndicator() {
    if (this.extension.getSettings().get_boolean('show-indicator')) {
      this.settingsMenu = new SettingsMenu(this.extension, this.onClear, this.onToggle);
      addToStatusArea(this.extension, this.settingsMenu);
    }
  }

  private removeIndicator() {
    this.settingsMenu?.destroy();
    this.settingsMenu = null;
  }

  animate() {
    this.settingsMenu?.animate();
  }

  enable() {
    this.indicatorChangeSignalId = this.extension.getSettings().connect('changed::show-indicator', () => {
      if (this.extension.getSettings().get_boolean('show-indicator')) {
        this.createIndicator();
      } else {
        this.removeIndicator();
      }
    });
    if (this.extension.getSettings().get_boolean('show-indicator')) {
      this.createIndicator();
    } else {
      this.removeIndicator();
    }
  }

  disable() {
    if (this.indicatorChangeSignalId) {
      this.extension.getSettings().disconnect(this.indicatorChangeSignalId);
      this.indicatorChangeSignalId = null;
    }
    this.removeIndicator();
  }
}
