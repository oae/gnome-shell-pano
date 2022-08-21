import { ActionRow, PreferencesGroup } from '@gi-types/adw1';
import { Settings } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
class Preferences extends PreferencesGroup {
  private settings: Settings;

  constructor() {
    super();

    this.settings = getCurrentExtensionSettings();

    const prefGroup = new PreferencesGroup();
    this.add(prefGroup);

    const testRow = new ActionRow({ title: 'Test' });
    prefGroup.add(testRow);

    const testSwitch = new Switch({
      active: true,
      valign: Align.CENTER,
    });

    testRow.add_suffix(testSwitch);
    testRow.activatable_widget = testSwitch;
  }
}

const init = (): void => log('prefs initialized');

const buildPrefsWidget = () => new Preferences();

export default { init, buildPrefsWidget };
