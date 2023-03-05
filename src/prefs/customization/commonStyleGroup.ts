import { PreferencesGroup } from '@gi-types/adw1';
import { Settings } from '@gi-types/gio2';
import { createColorRow, createSpinRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class CommonStyleGroup extends PreferencesGroup {
  private settings: Settings;
  constructor() {
    super({
      title: _('Common'),
    });

    this.settings = getCurrentExtensionSettings();

    this.add(
      createSpinRow(
        _('Window Height'),
        _('You can change the window height'),
        this.settings,
        'window-height',
        5,
        200,
        1000,
      ),
    );
    this.add(
      createColorRow(
        _('Window Background Color'),
        _('You can change the window background color'),
        this.settings,
        'window-background-color',
      ),
    );
    this.add(
      createColorRow(
        _('Incognito Window Background Color'),
        _('You can change the incognito window background color'),
        this.settings,
        'incognito-window-background-color',
      ),
    );
    this.add(
      createColorRow(
        _('Hovered Item Border Color'),
        _('You can change the active item border color'),
        this.settings,
        'active-item-border-color',
      ),
    );
    this.add(
      createColorRow(
        _('Hovered Item Border Color'),
        _('You can change the hovered item border color'),
        this.settings,
        'hovered-item-border-color',
      ),
    );
  }
}
