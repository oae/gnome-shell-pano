import { PreferencesGroup } from '@gi-types/adw1';
import { CodeItemStyleRow } from '@pano/prefs/customization/codeItemStyle';
import { ColorItemStyleRow } from '@pano/prefs/customization/colorItemStyle';
import { EmojiItemStyleRow } from '@pano/prefs/customization/emojiItemStyle';
import { FileItemStyleRow } from '@pano/prefs/customization/fileItemStyle';
import { ImageItemStyleRow } from '@pano/prefs/customization/imageItemStyle';
import { LinkItemStyleRow } from '@pano/prefs/customization/linkItemStyle';
import { TextItemStyleRow } from '@pano/prefs/customization/textItemStyle';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';

@registerGObjectClass
export class ItemStyleGroup extends PreferencesGroup {
  constructor() {
    super({
      title: _('Item Style'),
      margin_top: 10,
    });

    this.add(new LinkItemStyleRow());
    this.add(new TextItemStyleRow());
    this.add(new EmojiItemStyleRow());
    this.add(new FileItemStyleRow());
    this.add(new ImageItemStyleRow());
    this.add(new CodeItemStyleRow());
    this.add(new ColorItemStyleRow());
  }
}
