import { Settings } from '@gi-types/gio2';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import { createColorRow, createFontRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class FileItemStyleRow extends ItemExpanderRow {
  private settings: Settings;

  constructor() {
    super(_('File Item Style'), _('Change the style of the file item'), PanoItemTypes.FILE.iconName);

    this.settings = getCurrentExtensionSettings().get_child('file-item');

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

    // create body text color row
    this.add_row(
      createColorRow(_('Body Text Color'), _('You can change the text color of the body'), this.settings, 'body-color'),
    );

    // create body font row
    this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));
  }
}
