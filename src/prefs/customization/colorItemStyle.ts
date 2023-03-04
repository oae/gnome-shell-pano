import { Settings } from '@gi-types/gio2';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';
import { ItemExpanderRow } from './itemExpanderRow';
import { createColorRow, createFontRow } from './utils';

@registerGObjectClass
export class ColorItemStyleRow extends ItemExpanderRow {
  private settings: Settings;

  constructor() {
    super(_('Color Item Style'), _('Change the style of the color item'), PanoItemTypes.COLOR.iconName);

    this.settings = getCurrentExtensionSettings().get_child('color-item');

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

    // create metadata background color row
    this.add_row(
      createColorRow(
        _('Metadata Background Color'),
        _('You can change the background color of the metadata'),
        this.settings,
        'metadata-bg-color',
      ),
    );

    // create metadata text color row
    this.add_row(
      createColorRow(
        _('Metadata Text Color'),
        _('You can change the text color of the metadata'),
        this.settings,
        'metadata-color',
      ),
    );

    // create metadata font row
    this.add_row(
      createFontRow(_('Body Font'), _('You can change the font of the metadata'), this.settings, 'metadata-font'),
    );
  }
}
