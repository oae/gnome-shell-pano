import { ActionRow, PreferencesGroup, StatusPage, Window } from '@gi-types/adw1';
import {
  EVENT_STOP,
  KEY_0,
  KEY_9,
  KEY_A,
  KEY_a,
  KEY_Arabic_comma,
  KEY_Arabic_sukun,
  KEY_Cyrillic_HARDSIGN,
  KEY_Down,
  KEY_End,
  KEY_Escape,
  KEY_Greek_ALPHAaccent,
  KEY_Greek_omega,
  KEY_Hangul_J_YeorinHieuh,
  KEY_Hangul_Kiyeog,
  KEY_hebrew_doublelowline,
  KEY_hebrew_taf,
  KEY_Home,
  KEY_kana_fullstop,
  KEY_KP_Enter,
  KEY_Left,
  KEY_Mode_switch,
  KEY_Page_Down,
  KEY_Page_Up,
  KEY_Return,
  KEY_Right,
  KEY_semivoicedsound,
  KEY_Serbian_dje,
  KEY_space,
  KEY_Tab,
  KEY_Thai_kokai,
  KEY_Thai_lekkao,
  KEY_Up,
  KEY_Z,
  KEY_z,
  ModifierType,
} from '@gi-types/gdk4';
import { DBus, DBusCallFlags, File, Settings, SettingsBindFlags } from '@gi-types/gio2';
import {
  accelerator_get_default_mod_mask,
  accelerator_name_with_keycode,
  accelerator_valid,
  Adjustment,
  Button,
  ButtonsType,
  EventControllerKey,
  FileChooserAction,
  FileChooserNative,
  MessageDialog,
  ResponseType,
  ShortcutLabel,
  SpinButton,
} from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, getDbPath, initTranslations, logger, _ } from '@pano/utils/shell';

const debug = logger('prefs');
@registerGObjectClass
class Preferences extends PreferencesGroup {
  private settings: Settings;
  private fileChooser: FileChooserNative;

  constructor() {
    super();

    this.settings = getCurrentExtensionSettings();
    this.fileChooser = new FileChooserNative({
      modal: true,
      title: _('Choose pano database location'),
      action: FileChooserAction.SELECT_FOLDER,
      accept_label: 'Select',
    });
    this.fileChooser.set_current_folder(File.new_for_path(`${getDbPath()}`));
    this.fileChooser.connect('response', (chooser, response) => {
      if (response !== ResponseType.ACCEPT) {
        this.fileChooser.hide();
        return;
      }

      const dir = chooser.get_file();
      if (dir && dir.query_exists(null) && !dir.get_child('pano.db').query_exists(null)) {
        const path = dir.get_path();
        if (path) {
          this.settings.set_string('database-location', path);
        }
      } else {
        const md = new MessageDialog({
          text: _('Failed to select directory'),
          transient_for: this.get_root() as Window,
          destroy_with_parent: true,
          modal: true,
          visible: true,
          buttons: ButtonsType.OK,
        });
        md.connect('response', () => {
          md.destroy();
        });
      }
      this.fileChooser.hide();
    });

    const prefGroup = new PreferencesGroup();
    prefGroup.connect('map', () => {
      const parent = this.get_root() as Window;
      parent.width_request = 480;
      parent.height_request = 640;
      parent.resizable = false;
      this.fileChooser.set_transient_for(parent);
    });
    this.add(prefGroup);

    const dbRow = new ActionRow({
      title: _('Database Location'),
      subtitle: `<b>${getDbPath()}/pano.db</b>`,
    });
    prefGroup.add(dbRow);

    const dbLocationButton = new Button({
      margin_top: 10,
      margin_bottom: 10,
      icon_name: 'document-open-symbolic',
    });
    dbLocationButton.connect('clicked', () => {
      this.fileChooser.show();
    });
    dbRow.add_suffix(dbLocationButton);
    dbRow.set_activatable_widget(dbLocationButton);

    this.settings.connect('changed::database-location', () => {
      this.fileChooser.set_current_folder(File.new_for_path(`${getDbPath()}`));
      dbRow.set_subtitle(`<b>${getDbPath()}/pano.db</b>`);
    });

    const historyRow = new ActionRow({
      title: _('History Length'),
      subtitle: _('You can limit your clipboard history length between 10 - 500'),
    });
    prefGroup.add(historyRow);

    const historyEntry = new SpinButton({
      adjustment: new Adjustment({ step_increment: 10, lower: 10, upper: 500 }),
      value: this.settings.get_int('history-length'),
      margin_bottom: 10,
      margin_top: 10,
    });

    this.settings.bind('history-length', historyEntry, 'value', SettingsBindFlags.DEFAULT);

    historyRow.add_suffix(historyEntry);
    historyRow.set_activatable_widget(historyEntry);

    const shortcutRow = new ActionRow({
      title: _('Global Shortcut'),
      subtitle: _('Allows you to toggle visibility of the clipboard manager'),
    });
    prefGroup.add(shortcutRow);

    const shortcutLabel = new ShortcutLabel({
      disabled_text: _('Select a shortcut'),
      accelerator: this.settings.get_string('shortcut'),
      margin_bottom: 10,
      margin_top: 10,
    });

    this.settings.bind('shortcut', shortcutLabel, 'accelerator', SettingsBindFlags.DEFAULT);

    shortcutRow.connect('activated', () => {
      const ctl = new EventControllerKey();
      const content = new StatusPage({
        title: _('New shortcut'),
        icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
      });
      const editor = new Window({
        modal: true,
        transient_for: this.get_root() as Window,
        hide_on_close: true,
        width_request: 320,
        height_request: 240,
        resizable: false,
        content,
      });
      editor.add_controller(ctl);

      // See https://github.com/tuberry/color-picker/blob/1a278db139f00787e365fce5977d30b535529edb/color-picker%40tuberry/prefs.js
      ctl.connect('key-pressed', (_, keyval, keycode, state) => {
        let mask = state & accelerator_get_default_mod_mask();
        mask &= ~ModifierType.LOCK_MASK;
        if (!mask && keyval === KEY_Escape) {
          editor.close();
          return EVENT_STOP;
        }
        if (!this.isValidBinding(mask, keycode, keyval) || !this.isValidAccel(mask, keyval)) {
          return EVENT_STOP;
        }

        this.settings.set_string('shortcut', accelerator_name_with_keycode(null, keyval, keycode, mask));
        editor.destroy();

        return EVENT_STOP;
      });
      editor.present();
    });

    shortcutRow.add_suffix(shortcutLabel);
    shortcutRow.set_activatable_widget(shortcutLabel);

    const clearHistoryRow = new ActionRow({
      title: _('Clear History'),
      subtitle: _('Clears the clipboard database and cache'),
    });
    prefGroup.add(clearHistoryRow);

    const clearHistoryButton = new Button({
      css_classes: ['destructive-action'],
      label: _('Clear'),
      margin_top: 10,
      margin_bottom: 10,
    });
    clearHistoryButton.connect('clicked', () => {
      const md = new MessageDialog({
        text: _('Are you sure you want to clear history?'),
        transient_for: this.get_root() as Window,
        destroy_with_parent: true,
        modal: true,
        visible: true,
        buttons: ButtonsType.OK_CANCEL,
      });
      md.get_widget_for_response(ResponseType.OK)?.add_css_class('destructive-action');
      md.connect('response', (_, response) => {
        if (response === ResponseType.OK) {
          DBus.session.call(
            'org.gnome.Shell',
            '/io/elhan/Pano',
            'io.elhan.Pano',
            'clearHistory',
            null,
            null,
            DBusCallFlags.NONE,
            -1,
            null,
            null,
          );
        }

        md.destroy();
      });
    });

    clearHistoryRow.add_suffix(clearHistoryButton);
  }

  private keyvalIsForbidden(keyval) {
    return [
      KEY_Home,
      KEY_Left,
      KEY_Up,
      KEY_Right,
      KEY_Down,
      KEY_Page_Up,
      KEY_Page_Down,
      KEY_End,
      KEY_Tab,
      KEY_KP_Enter,
      KEY_Return,
      KEY_Mode_switch,
    ].includes(keyval);
  }

  private isValidAccel(mask, keyval) {
    return accelerator_valid(keyval, mask) || (keyval === KEY_Tab && mask !== 0);
  }

  private isValidBinding(mask, keycode, keyval) {
    return !(
      mask === 0 ||
      (mask === ModifierType.SHIFT_MASK &&
        keycode !== 0 &&
        ((keyval >= KEY_a && keyval <= KEY_z) ||
          (keyval >= KEY_A && keyval <= KEY_Z) ||
          (keyval >= KEY_0 && keyval <= KEY_9) ||
          (keyval >= KEY_kana_fullstop && keyval <= KEY_semivoicedsound) ||
          (keyval >= KEY_Arabic_comma && keyval <= KEY_Arabic_sukun) ||
          (keyval >= KEY_Serbian_dje && keyval <= KEY_Cyrillic_HARDSIGN) ||
          (keyval >= KEY_Greek_ALPHAaccent && keyval <= KEY_Greek_omega) ||
          (keyval >= KEY_hebrew_doublelowline && keyval <= KEY_hebrew_taf) ||
          (keyval >= KEY_Thai_kokai && keyval <= KEY_Thai_lekkao) ||
          (keyval >= KEY_Hangul_Kiyeog && keyval <= KEY_Hangul_J_YeorinHieuh) ||
          (keyval === KEY_space && mask === 0) ||
          this.keyvalIsForbidden(keyval)))
    );
  }
}

const init = (): void => {
  debug('prefs initialized');
  initTranslations();
};

const buildPrefsWidget = () => new Preferences();

export default { init, buildPrefsWidget };
