import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import {
  createColorRow,
  createDropdownRow,
  createFontRow,
  createSpinRow,
  createSwitchRow,
} from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class CommonStyleGroup extends Adw.PreferencesGroup {
  private settings: Gio.Settings;
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Common'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.add(
      createDropdownRow(_('Icon Pack'), _('You can change the icon pack'), this.settings, 'icon-pack', [
        _('Default Icons'),
        _('Legacy Icons'),
      ]),
    );

    this.add(
      createSpinRow(_('Item Width'), _('You can change the item width'), this.settings, 'item-width', 5, 200, 1000),
    );

    this.add(
      createSpinRow(_('Item Height'), _('You can change the item height'), this.settings, 'item-height', 5, 100, 1000),
    );

    this.add(
      createSwitchRow(
        _('Enable Headers'),
        _('Controls the visibility of the clipboard item headers'),
        this.settings,
        'enable-headers',
      ),
    );

    this.add(
      createSwitchRow(
        _('Compact Mode'),
        _('Controls the compactness of the clipboard item.'),
        this.settings,
        'compact-mode',
      ),
    );

    this.add(
      createDropdownRow(
        _('Window Position'),
        _('You can change position of the Pano'),
        this.settings,
        'window-position',
        [_('Top'), _('Right'), _('Bottom'), _('Left')],
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
      createFontRow(
        _('Search Bar Font'),
        _('You can change the font of the search bar'),
        this.settings,
        'search-bar-font',
      ),
    );
    this.add(
      createFontRow(_('Item Title Font'), _('You can change the font of the title'), this.settings, 'item-title-font'),
    );
    this.add(
      createFontRow(_('Item Date Font'), _('You can change the font of the date'), this.settings, 'item-date-font'),
    );
    this.add(
      createColorRow(
        _('Active Item Border Color'),
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
    this.add(
      createSwitchRow(
        _('Show Controls on Hover'),
        _('When enabled, the controls will only show on hover'),
        this.settings,
        'show-controls-on-hover',
      ),
    );
  }
}
