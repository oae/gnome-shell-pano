import Adw from '@girs/adw-1';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { CodeItemStyleRow } from '@pano/prefs/customization/codeItemStyle';
import { ColorItemStyleRow } from '@pano/prefs/customization/colorItemStyle';
import { EmojiItemStyleRow } from '@pano/prefs/customization/emojiItemStyle';
import { FileItemStyleRow } from '@pano/prefs/customization/fileItemStyle';
import { ImageItemStyleRow } from '@pano/prefs/customization/imageItemStyle';
import { LinkItemStyleRow } from '@pano/prefs/customization/linkItemStyle';
import { TextItemStyleRow } from '@pano/prefs/customization/textItemStyle';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

@registerGObjectClass
export class ItemStyleGroup extends Adw.PreferencesGroup {
  private codeItemStyleRow: CodeItemStyleRow;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Item Style'),
      marginTop: 10,
    });

    this.add(new LinkItemStyleRow(ext));
    this.add(new TextItemStyleRow(ext));
    this.add(new EmojiItemStyleRow(ext));
    this.add(new FileItemStyleRow(ext));
    this.add(new ImageItemStyleRow(ext));

    this.codeItemStyleRow = new CodeItemStyleRow(ext);
    this.add(this.codeItemStyleRow);
    this.add(new ColorItemStyleRow(ext));
  }

  public scan() {
    this.codeItemStyleRow.scan();
  }
}
