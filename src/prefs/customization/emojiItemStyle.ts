import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { ItemExpanderRow } from '@pano/prefs/customization/itemExpanderRow';
import { createColorRow, createSpinRow } from '@pano/prefs/customization/utils';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class EmojiItemStyleRow extends ItemExpanderRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super(ext, _('Emoji Item Style'), _('Change the style of the emoji item'), getPanoItemTypes(ext).EMOJI.iconName);

    this.settings = getCurrentExtensionSettings(ext).get_child('emoji-item');

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
