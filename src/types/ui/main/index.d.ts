import { MessageTray } from '../messageTray';

export {
  activateWindow,
  componentManager,
  createLookingGlass,
  ctrlAltTabManager,
  getThemeStylesheet,
  initializeDeferredWork,
  inputMethod,
  introspectService,
  kbdA11yDialog,
  keyboard,
  layoutManager,
  loadTheme,
  locatePointer,
  magnifier,
  moveWindowToMonitorAndWorkspace,
  notificationDaemon,
  notify,
  notifyError,
  osdMonitorLabeler,
  osdWindowManager,
  padOsdService,
  panel,
  popModal,
  pushModal,
  screenSaverDBus,
  screenshotUI,
  setThemeStylesheet,
  shellAccessDialogDBusService,
  shellAudioSelectionDBusService,
  shellDBusService,
  shellMountOpDBusService,
  start,
  uiGroup,
  windowAttentionHandler,
  xdndHandler,
} from '@girs/gnome-shell/src/ui/main';

export let extensionManager: any;
export let overview: any;
export let runDialog: any;
export let lookingGlass: any;
export let welcomeDialog: any;
export let wm: any;
export let messageTray: MessageTray;
export let screenShield: any;
export let sessionMode: any;
