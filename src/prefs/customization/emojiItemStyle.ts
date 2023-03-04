import { Settings } from '@gi-types/gio2';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';
import { ItemExpanderRow } from './itemExpanderRow';
import { createColorRow, createSpinRow } from './utils';

@registerGObjectClass
export class EmojiItemStyleRow extends ItemExpanderRow {
  private settings: Settings;

  constructor() {
    super(_('Emoji Item Style'), _('Change the style of the emoji item'), PanoItemTypes.EMOJI.iconName);

    this.settings = getCurrentExtensionSettings().get_child('emoji-item');

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

    // create character length row
    this.add_row(
      createSpinRow(_('Emoji Size'), _('You can change the emoji size'), this.settings, 'emoji-size', 1, 10, 300),
    );
  }
}
