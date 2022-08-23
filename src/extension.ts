import { PanoWindow } from '@pano/containers/panoWindow';
import { clipboardManager } from '@pano/utils/clipboardManager';
import { db } from '@pano/utils/db';
import { KeyManager } from '@pano/utils/keyManager';
import { logger, setupAppDirs } from '@pano/utils/shell';
import { addChrome, removeChrome } from '@pano/utils/ui';
import './styles/stylesheet.css';

const debug = logger('extension');
class PanoExtension {
  private panoWindow: PanoWindow;
  private keyManager: KeyManager;

  constructor() {
    setupAppDirs();
    db.setup();
    debug('extension is initialized');
    this.keyManager = new KeyManager();
    this.panoWindow = new PanoWindow();
  }

  enable(): void {
    setupAppDirs();
    db.start();
    addChrome(this.panoWindow);
    // TODO: read from settings
    this.keyManager.listenFor('<super><shift>v', () => this.panoWindow.toggle());
    clipboardManager.startTracking();

    debug('extension is enabled');
  }

  disable(): void {
    this.keyManager.stopListening();
    clipboardManager.stopTracking();
    removeChrome(this.panoWindow);
    debug('extension is disabled');
    db.shutdown();
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}
