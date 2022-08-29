import { AsyncResult, File, FileCopyFlags, Settings, Subprocess, SubprocessFlags } from '@gi-types/gio2';
import { get_user_cache_dir, get_user_data_dir } from '@gi-types/glib2';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    log(`[pano] [${prefix}] ${content}`);

const debug = logger('shell-utils');

export const execute = async (command: string): Promise<string> => {
  const process = new Subprocess({
    argv: ['bash', '-c', command],
    flags: SubprocessFlags.STDOUT_PIPE,
  });

  process.init(null);

  return new Promise((resolve, reject) => {
    process.communicate_utf8_async(null, null, (_, result: AsyncResult) => {
      const [, stdout, stderr] = process.communicate_utf8_finish(result);
      if (stderr) {
        reject(stderr);
      } else if (stdout) {
        resolve(stdout.trim());
      } else {
        resolve('');
      }
    });
  });
};

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

export const moveDbFile = (from: string, to: string) => {
  if (from === to) {
    return;
  }

  const oldDb = File.new_for_path(`${from}/pano.db`);
  const newDb = File.new_for_path(`${to}/pano.db`);
  if (oldDb.query_exists(null) && !newDb.query_exists(null)) {
    const newDBParent = File.new_for_path(to);
    if (!newDBParent.query_exists(null)) {
      newDBParent.make_directory_with_parents(null);
    }
    oldDb.move(newDb, FileCopyFlags.ALL_METADATA, null, null);
  }
};

export const deleteAppDirs = async (): Promise<void> => {
  const appDataPath = File.new_for_path(getAppDataPath());
  if (appDataPath.query_exists(null)) {
    await execute(`rm -rf ${getAppDataPath()}`);
  }
  const cachePath = File.new_for_path(getCachePath());
  if (cachePath.query_exists(null)) {
    await execute(`rm -rf ${getCachePath()}`);
  }
  const dbPath = File.new_for_path(`${getDbPath()}/pano.db`);
  if (dbPath.query_exists(null)) {
    dbPath.delete(null);
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
    debug(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};
