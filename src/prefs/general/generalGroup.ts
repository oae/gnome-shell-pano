import { PreferencesGroup } from '@gi-types/adw1';
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
import { _ } from '@pano/utils/shell';

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
    this.add(new SyncPrimaryRow());
    this.add(new PasteOnSelectRow());
    this.add(new SendNotificationOnCopyRow());
    this.add(new PlayAudioOnCopyRow());
    this.add(new KeepSearchEntryRow());
    this.add(new ShowIndicatorRow());
    this.add(new LinkPreviewsRow());
    this.add(new OpenLinksInBrowserRow());
    this.add(new WatchExclusionsRow());
  }
}
