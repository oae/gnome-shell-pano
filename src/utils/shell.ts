import { Actor } from '@imports/clutter10';
import { File, Settings } from '@imports/gio2';
import { get_user_cache_dir, get_user_data_dir } from '@imports/glib2';
import { Global } from '@imports/shell0';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    log(`[pano] [${prefix}] ${content}`);

const debug = logger('utils');

const global = Global.get();

export const getAppDataPath = (): string => `${get_user_data_dir()}/pano`;

export const getImagesPath = (): string => `${getAppDataPath()}/images`;

export const getCachePath = (): string => `${get_user_cache_dir()}/pano`;

export const setupAppDirs = (): void => {
  const appDataPath = File.new_for_path(getImagesPath());
  if (!appDataPath.query_exists(null)) {
    appDataPath.make_directory_with_parents(null);
  }
  const cachePath = File.new_for_path(getCachePath());
  if (!cachePath.query_exists(null)) {
    cachePath.make_directory_with_parents(null);
  }
};

export const getCurrentExtension = (): any => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const notify = (text: string): void => {
  const settings = getCurrentExtensionSettings();
  const showNotifications = settings.get_boolean('show-notifications');
  if (showNotifications) {
    imports.ui.main.notify(text);
  } else {
    debug(`Notifications are disabled. Logging the content instead. Content: ${text}`);
  }
};

export const loadInterfaceXML = (iface: string): any => {
  const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
  const file = File.new_for_uri(uri);

  try {
    const [, bytes] = file.load_contents(null);
    return imports.byteArray.toString(bytes);
  } catch (e) {
    debug(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};

export const wm = imports.ui.main.wm;

export const getMonitors = (): Monitor[] => imports.ui.main.layoutManager.monitors;

export const getMonitorIndexForPointer = () => {
  const [x, y] = global.get_pointer();
  const monitors = getMonitors();

  for (let i = 0; i <= monitors.length; i++) {
    const monitor = monitors[i];

    if (x >= monitor.x && x < monitor.x + monitor.width && y >= monitor.y && y < monitor.y + monitor.height) {
      return i;
    }
  }

  return imports.ui.main.layoutManager.primaryIndex;
};

export const getMonitorConstraint = () =>
  new imports.ui.layout.MonitorConstraint({
    index: getMonitorIndexForPointer(),
  });

export const getMonitorConstraintForIndex = (index: number) =>
  new imports.ui.layout.MonitorConstraint({
    index,
  });

export const addChrome = (actor: Actor, options?: any) => imports.ui.main.layoutManager.addChrome(actor, options);
export const removeChrome = (actor: Actor) => imports.ui.main.layoutManager.removeChrome(actor);
