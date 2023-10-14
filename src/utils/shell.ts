import {
  app_info_launch_default_for_uri,
  File,
  FileCopyFlags,
  FileEnumerator,
  FileInfo,
  FilePrototype,
  FileQueryInfoFlags,
  FileType,
  Settings,
} from '@gi-types/gio2';
import {
  get_user_cache_dir,
  get_user_data_dir,
  PRIORITY_DEFAULT,
  Source,
  SOURCE_REMOVE,
  timeout_add,
} from '@gi-types/glib2';
import { ExtensionBase, GetTextString } from '@gnome-shell/extensions/extension';
import { ATTR_EVENT_ID, Context } from '@imports/gsound1';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    console.log(`[pano] [${prefix}] ${content}`);

const debug = logger('shell-utils');

const deleteFile = (file: FilePrototype) => {
  return new Promise((resolve, reject) => {
    file.delete_async(PRIORITY_DEFAULT, null, (_file, res) => {
      try {
        resolve(file.delete_finish(res));
      } catch (e) {
        reject(e);
      }
    });
  });
};

const deleteDirectory = async (file: FilePrototype) => {
  try {
    const iter: FileEnumerator | undefined = await new Promise((resolve, reject) => {
      file.enumerate_children_async(
        'standard::type',
        FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
        PRIORITY_DEFAULT,
        null,
        (file, res) => {
          try {
            resolve(file?.enumerate_children_finish(res));
          } catch (e) {
            reject(e);
          }
        },
      );
    });

    if (!iter) {
      return;
    }

    const branches: any[] = [];

    while (true) {
      const infos: FileInfo[] = await new Promise((resolve, reject) => {
        iter.next_files_async(10, PRIORITY_DEFAULT, null, (it, res) => {
          try {
            resolve(it ? it.next_files_finish(res) : []);
          } catch (e) {
            reject(e);
          }
        });
      });

      if (infos.length === 0) {
        break;
      }

      for (const info of infos) {
        const child = iter.get_child(info);
        const type = info.get_file_type();

        let branch;

        switch (type) {
          case FileType.REGULAR:
          case FileType.SYMBOLIC_LINK:
            branch = deleteFile(child);
            break;

          case FileType.DIRECTORY:
            branch = deleteDirectory(child);
            break;

          default:
            continue;
        }

        branches.push(branch);
      }
    }

    await Promise.all(branches);
  } catch (e) {
  } finally {
    return deleteFile(file);
  }
};

export const getAppDataPath = (ext: ExtensionBase): string => `${get_user_data_dir()}/${ext.uuid}`;

export const getImagesPath = (ext: ExtensionBase): string => `${getAppDataPath(ext)}/images`;

export const getCachePath = (ext: ExtensionBase): string => `${get_user_cache_dir()}/${ext.uuid}`;

export const setupAppDirs = (ext: ExtensionBase): void => {
  const imagePath = File.new_for_path(getImagesPath(ext));
  if (!imagePath.query_exists(null)) {
    imagePath.make_directory_with_parents(null);
  }
  const cachePath = File.new_for_path(getCachePath(ext));
  if (!cachePath.query_exists(null)) {
    cachePath.make_directory_with_parents(null);
  }
  const dbPath = File.new_for_path(`${getDbPath(ext)}`);
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

export const deleteAppDirs = async (ext: ExtensionBase): Promise<void> => {
  const appDataPath = File.new_for_path(getAppDataPath(ext));
  if (appDataPath.query_exists(null)) {
    await deleteDirectory(appDataPath);
  }
  const cachePath = File.new_for_path(getCachePath(ext));
  if (cachePath.query_exists(null)) {
    await deleteDirectory(cachePath);
  }
  const dbPath = File.new_for_path(`${getDbPath(ext)}/pano.db`);
  if (dbPath.query_exists(null)) {
    dbPath.delete(null);
  }
};

export const getDbPath = (ext: ExtensionBase): string => {
  const path = getCurrentExtensionSettings(ext).get_string('database-location');
  if (!path) {
    return getAppDataPath(ext);
  }

  return path;
};
export const getCurrentExtensionSettings = (ext: ExtensionBase): Settings => ext.getSettings();

export const loadInterfaceXML = (ext: ExtensionBase, iface: string): any => {
  const uri = `file:///${ext.path}/dbus/${iface}.xml`;
  const file = File.new_for_uri(uri);

  try {
    const [, bytes] = file.load_contents(null);
    return imports.byteArray.toString(bytes);
  } catch (e) {
    debug(`Failed to load D-Bus interface ${iface}`);
  }

  return null;
};

let soundContext: null | Context = null;

export const playAudio = () => {
  try {
    if (!soundContext) {
      soundContext = new Context();
      soundContext.init(null);
    }
    soundContext.play_simple(
      {
        [ATTR_EVENT_ID]: 'message',
      },
      null,
    );
  } catch (err) {
    debug(`failed to play audio: ${err}`);
  }
};

export const removeSoundContext = () => {
  if (soundContext) {
    soundContext.run_dispose();
    soundContext = null;
  }
};

export let debounceIds: number[] = [];

export function debounce(func, wait) {
  let sourceId;
  return function (...args) {
    const debouncedFunc = function (this: unknown) {
      debounceIds = debounceIds.filter((id) => id !== sourceId);
      sourceId = null;
      func.apply(this, args);

      return SOURCE_REMOVE;
    };

    if (sourceId) {
      Source.remove(sourceId);
      debounceIds = debounceIds.filter((id) => id !== sourceId);
    }
    sourceId = timeout_add(PRIORITY_DEFAULT, wait, debouncedFunc);
    debounceIds.push(sourceId);
  };
}

export const openLinkInBrowser = (url: string) => {
  try {
    app_info_launch_default_for_uri(url, null);
  } catch (e) {
    debug(`Failed to open url ${url}`);
  }
};

export function gettext(ext: ExtensionBase): (str: string) => GetTextString {
  return ext.gettext.bind(ext);
}
