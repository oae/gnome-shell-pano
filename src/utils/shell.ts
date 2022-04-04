import { Settings } from '@imports/gio2';

export const logger =
  (prefix: string) =>
  (content: string): void =>
    log(`[pano] [${prefix}] ${content}`);

const debug = logger('utils');

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
