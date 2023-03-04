import { PreferencesGroup } from '@gi-types/adw1';
import { DBLocationRow } from '@pano/prefs/general/dbLocation';
import { HistoryLengthRow } from '@pano/prefs/general/historyLength';
import { PasteOnSelectRow } from '@pano/prefs/general/pasteOnSelect';
import { PlayAudioOnCopyRow } from '@pano/prefs/general/playAudioOnCopy';
import { ShortcutRow } from '@pano/prefs/general/shortcutRow';
import { WatchExclusionsRow } from '@pano/prefs/general/watchExclusions';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _ } from '@pano/utils/shell';
import { IncognitoShortcutRow } from '@pano/prefs/general/incognitoShortcutRow';
import { ShowIndicatorRow } from '@pano/prefs/general/showIndicator';
import { LinkPreviewsRow } from '@pano/prefs/general/linkPreviews';
import { SyncPrimaryRow } from './syncPrimary';
import { KeepSearchEntryRow } from './keepSearchEntryOnHide';
import { SendNotificationOnCopyRow } from './sendNotificationOnCopy';
import { OpenLinksInBrowserRow } from './openLinksInBrowser';

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
