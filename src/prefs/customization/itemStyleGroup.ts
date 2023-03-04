import { PreferencesGroup } from '@gi-types/adw1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { CodeItemStyleRow } from './codeItemStyle';
import { ColorItemStyleRow } from './colorItemStyle';
import { EmojiItemStyleRow } from './emojiItemStyle';
import { FileItemStyleRow } from './fileItemStyle';
import { ImageItemStyleRow } from './imageItemStyle';
import { LinkItemStyleRow } from './linkItemStyle';
import { TextItemStyleRow } from './textItemStyle';

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
