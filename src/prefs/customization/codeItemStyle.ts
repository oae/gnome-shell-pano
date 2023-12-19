import Gio from '@girs/gio-2.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import { createColorRow, createFontRow, createSpinRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class CodeItemStyleRow extends ItemExpanderRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super(ext, _('Code Item Style'), _('Change the style of the code item'), getPanoItemTypes(ext).CODE.iconName);

    this.settings = getCurrentExtensionSettings(ext).get_child('code-item');

    // create header background color row
    this.add_row(
      createColorRow(
        _('Header Background Color'),
        _('You can change the background color of the header'),
        this.settings,
        'header-bg-color',
      ),
    );

    // create header text color row
    this.add_row(
      createColorRow(
        _('Header Text Color'),
        _('You can change the text color of the header'),
        this.settings,
        'header-color',
      ),
    );

    // create body background color row
    this.add_row(
      createColorRow(
        _('Body Background Color'),
        _('You can change the background color of the body'),
        this.settings,
        'body-bg-color',
      ),
    );

    // create body font row
    this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));

    // create character length row
    this.add_row(
      createSpinRow(
        _('Character Length'),
        _('You can change the character length of the visible text in the body'),
        this.settings,
        'char-length',
        50,
        50,
        5000,
      ),
    );
  }
}
