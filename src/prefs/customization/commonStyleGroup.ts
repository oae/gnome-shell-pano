import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { createColorRow, createDropdownRow, createFontRow, createSpinRow } from '@pano/prefs/customization/utils';
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
      createSpinRow(_('Item Size'), _('You can change the item size'), this.settings, 'item-size', 5, 200, 1000),
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
  }
}
