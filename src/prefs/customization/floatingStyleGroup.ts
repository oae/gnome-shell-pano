import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { createSpinRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class FloatingStyleGroup extends Adw.ExpanderRow {
  private settings: Gio.Settings;
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Floating'),
      subtitle: _('You can change the floating style'),
      showEnableSwitch: true,
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.enableExpansion = this.settings.get_boolean('window-floating');
    this.settings.bind('window-floating', this, 'enable-expansion', Gio.SettingsBindFlags.DEFAULT);

    this.add_row(
      createSpinRow(
        _('Left Margin'),
        _('You can change the left margin'),
        this.settings,
        'window-margin-left',
        5,
        0,
        1000,
      ),
    );

    this.add_row(
      createSpinRow(
        _('Right Margin'),
        _('You can change the right margin'),
        this.settings,
        'window-margin-right',
        5,
        0,
        1000,
      ),
    );

    this.add_row(
      createSpinRow(
        _('Top Margin'),
        _('You can change the top margin'),
        this.settings,
        'window-margin-top',
        5,
        0,
        1000,
      ),
    );

    this.add_row(
      createSpinRow(
        _('Bottom Margin'),
        _('You can change the bottom margin'),
        this.settings,
        'window-margin-bottom',
        5,
        0,
        1000,
      ),
    );
  }
}
