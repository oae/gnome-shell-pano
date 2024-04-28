import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import { createColorRow, createFontRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class FileItemStyleRow extends ItemExpanderRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super(ext, _('File Item Style'), _('Change the style of the file item'), getPanoItemTypes(ext).FILE.iconName);

    this.settings = getCurrentExtensionSettings(ext).get_child('file-item');

    // create body background color row
    this.add_row(
      createColorRow(
        _('Body Background Color'),
        _('You can change the background color of the body'),
        this.settings,
        'body-bg-color',
      ),
    );

    // create title text color row
    this.add_row(
      createColorRow(
        _('Title Text Color'),
        _('You can change the text color of the title'),
        this.settings,
        'title-color',
      ),
    );

    // create title font row
    this.add_row(
      createFontRow(_('Title Font'), _('You can change the font of the title'), this.settings, 'title-font'),
    );

    // create body text color row
    this.add_row(
      createColorRow(_('Body Text Color'), _('You can change the text color of the body'), this.settings, 'body-color'),
    );

    // create body font row
    this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));
  }
}
