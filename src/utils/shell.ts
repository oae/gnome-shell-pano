import { File, Settings } from '@gi-types/gio2';
import { get_user_cache_dir, get_user_data_dir } from '@gi-types/glib2';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    log(`[pano] [${prefix}] ${content}`);

export const getAppDataPath = (): string => `${get_user_data_dir()}/${getCurrentExtension().metadata.uuid}`;

export const getImagesPath = (): string => `${getAppDataPath()}/images`;

export const getCachePath = (): string => `${get_user_cache_dir()}/${getCurrentExtension().metadata.uuid}`;

export const setupAppDirs = (): void => {
  const imagePath = File.new_for_path(getImagesPath());
  if (!imagePath.query_exists(null)) {
    imagePath.make_directory_with_parents(null);
  }
  const cachePath = File.new_for_path(getCachePath());
  if (!cachePath.query_exists(null)) {
    cachePath.make_directory_with_parents(null);
  }
  const dbPath = File.new_for_path(`${getDbPath()}`);
  if (!dbPath.query_exists(null)) {
    dbPath.make_directory_with_parents(null);
  }
};

export const deleteAppDirs = (): void => {
  const appDataPath = File.new_for_path(getAppDataPath());
  if (appDataPath.query_exists(null)) {
    appDataPath.trash(null);
  }
  const cachePath = File.new_for_path(getCachePath());
  if (cachePath.query_exists(null)) {
    cachePath.trash(null);
  }
  const dbPath = File.new_for_path(`${getDbPath()}/pano.db`);
  if (dbPath.query_exists(null)) {
    dbPath.trash(null);
  }
};

export const getDbPath = (): string => {
  const path = getCurrentExtensionSettings().get_string('database-location');
  if (!path) {
    return getAppDataPath();
  }

  return path;
};

export const getCurrentExtension = (): any => imports.misc.extensionUtils.getCurrentExtension();

export const getCurrentExtensionSettings = (): Settings => imports.misc.extensionUtils.getSettings();

export const loadInterfaceXML = (iface: string): any => {
  const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
  const file = File.new_for_uri(uri);

  try {
    const [, bytes] = file.load_contents(null);
    return imports.byteArray.toString(bytes);
  } catch (e) {
    log(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};
