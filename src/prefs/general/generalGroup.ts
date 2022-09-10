import { PreferencesGroup } from '@gi-types/adw1';
import { DBLocationRow } from '@pano/prefs/general/dbLocation';
import { HistoryLengthRow } from '@pano/prefs/general/historyLength';
import { PasteOnSelectRow } from '@pano/prefs/general/pasteOnSelect';
import { PlayAudioOnCopyRow } from '@pano/prefs/general/playAudioOnCopy';
import { ShortcutRow } from '@pano/prefs/general/shortcutRow';
import { WatchExclusionsRow } from '@pano/prefs/general/watchExclusions';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { IncognitoShortcutRow } from './incognitoShortcutRow';

@registerGObjectClass
export class GeneralGroup extends PreferencesGroup {
  constructor() {
    super({
      title: _('General Options'),
    });

    this.add(new DBLocationRow());
    this.add(new HistoryLengthRow());
    this.add(new ShortcutRow());
    this.add(new IncognitoShortcutRow());
    this.add(new PasteOnSelectRow());
    this.add(new PlayAudioOnCopyRow());
    this.add(new WatchExclusionsRow());
  }
}
