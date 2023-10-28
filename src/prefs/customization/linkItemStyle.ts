import Gio from '@girs/gio-2.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import { createColorRow, createFontRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class LinkItemStyleRow extends ItemExpanderRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super(ext, _('Link Item Style'), _('Change the style of the link item'), getPanoItemTypes(ext).LINK.iconName);

    this.settings = getCurrentExtensionSettings(ext).get_child('link-item');

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

    // create metadata background color row
    this.add_row(
      createColorRow(
        _('Metadata Background Color'),
        _('You can change the background color of the metadata'),
        this.settings,
        'metadata-bg-color',
      ),
    );

    // create metadata title color row
    this.add_row(
      createColorRow(
        _('Metadata Title Color'),
        _('You can change the title color of the metadata'),
        this.settings,
        'metadata-title-color',
      ),
    );

    // create metadata title font row
    this.add_row(
      createFontRow(
        _('Metadata Title Font'),
        _('You can change the font of the metadata title'),
        this.settings,
        'metadata-title-font',
      ),
    );

    // create metadata description color row
    this.add_row(
      createColorRow(
        _('Metadata Description Color'),
        _('You can change the description color of the metadata'),
        this.settings,
        'metadata-description-color',
      ),
    );

    // create metadata description font row
    this.add_row(
      createFontRow(
        _('Metadata Description Font'),
        _('You can change the font of the metadata description'),
        this.settings,
        'metadata-description-font',
      ),
    );

    // create metadata link color row
    this.add_row(
      createColorRow(
        _('Metadata Link Color'),
        _('You can change the link color of the metadata'),
        this.settings,
        'metadata-link-color',
      ),
    );

    // create metadata link font row
    this.add_row(
      createFontRow(
        _('Metadata Link Font'),
        _('You can change the font of the metadata link'),
        this.settings,
        'metadata-link-font',
      ),
    );
  }
}
