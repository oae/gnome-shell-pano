import Adw from '@girs/adw-1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { DBLocationRow } from '@pano/prefs/general/dbLocation';
import { HistoryLengthRow } from '@pano/prefs/general/historyLength';
import { IncognitoShortcutRow } from '@pano/prefs/general/incognitoShortcutRow';
import { KeepSearchEntryRow } from '@pano/prefs/general/keepSearchEntryOnHide';
import { LinkPreviewsRow } from '@pano/prefs/general/linkPreviews';
import { OpenLinksInBrowserRow } from '@pano/prefs/general/openLinksInBrowser';
import { PasteOnSelectRow } from '@pano/prefs/general/pasteOnSelect';
import { PlayAudioOnCopyRow } from '@pano/prefs/general/playAudioOnCopy';
import { SendNotificationOnCopyRow } from '@pano/prefs/general/sendNotificationOnCopy';
import { ShortcutRow } from '@pano/prefs/general/shortcutRow';
import { ShowIndicatorRow } from '@pano/prefs/general/showIndicator';
import { SyncPrimaryRow } from '@pano/prefs/general/syncPrimary';
import { WatchExclusionsRow } from '@pano/prefs/general/watchExclusions';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

import { WiggleIndicatorRow } from './wiggleIndicator';

@registerGObjectClass
export class GeneralGroup extends Adw.PreferencesGroup {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('General Options'),
    });

    this.add(new DBLocationRow(ext));
    this.add(new HistoryLengthRow(ext));
    this.add(new ShortcutRow(ext));
    this.add(new IncognitoShortcutRow(ext));
    this.add(new SyncPrimaryRow(ext));
    this.add(new PasteOnSelectRow(ext));
    this.add(new SendNotificationOnCopyRow(ext));
    this.add(new PlayAudioOnCopyRow(ext));
    this.add(new KeepSearchEntryRow(ext));
    this.add(new ShowIndicatorRow(ext));
    this.add(new WiggleIndicatorRow(ext));
    this.add(new LinkPreviewsRow(ext));
    this.add(new OpenLinksInBrowserRow(ext));
    this.add(new WatchExclusionsRow(ext));
  }
}
