import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import GObject from '@girs/gobject-2.0';
import Shell from '@girs/shell-14';
import St from '@girs/st-14';
import { registerGObjectClass, SignalsDefinition } from '@pano/utils/gjs';
import { ICON_PACKS, IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { Locale } from 'date-fns';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import * as dateLocale from 'date-fns/locale';

const langs = GLib.get_language_names_with_category('LC_MESSAGES').map(
  (l) => l.replaceAll('_', '').replaceAll('-', '').split('.')[0],
);
const localeKey = Object.keys(dateLocale).find((key) => langs.includes(key));

export type PanoItemHeaderSignalType = 'on-remove' | 'on-favorite';
interface PanoItemHeaderSignals extends SignalsDefinition<PanoItemHeaderSignalType> {
  'on-remove': Record<string, never>;
  'on-favorite': Record<string, never>;
}

type FormatOptions = {
  includeSeconds?: boolean;
  addSuffix?: boolean;
  locale?: Locale;
};

@registerGObjectClass
export class PanoItemHeader extends St.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, PanoItemHeaderSignals> = {
    GTypeName: 'PanoItemHeader',
    Signals: {
      'on-remove': {},
      'on-favorite': {},
    },
  };

  private dateUpdateIntervalId: any;
  private favoriteButton: St.Button;
  private settings: Gio.Settings;
  private titleLabel: St.Label;
  private dateLabel: St.Label;
  actionContainer: St.BoxLayout;
  titleContainer: St.BoxLayout;
  iconContainer: St.BoxLayout;
  itemType: IPanoItemType;

  constructor(ext: ExtensionBase, itemType: IPanoItemType, date: Date) {
    super({
      styleClass: `pano-item-header pano-item-header-${itemType.classSuffix}`,
      vertical: false,
    });
    this.itemType = itemType;
    this.titleContainer = new St.BoxLayout({
      styleClass: 'pano-item-title-container',
      vertical: true,
      xExpand: true,
    });
    this.iconContainer = new St.BoxLayout({
      styleClass: 'pano-icon-container',
    });

    this.settings = getCurrentExtensionSettings(ext);

    const themeContext = St.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    this.set_height(56 * themeContext.scaleFactor);

    themeContext.connect('notify::scale-factor', () => {
      this.set_height(56 * themeContext.scaleFactor);
    });

    const icon = new St.Icon({
      styleClass: 'pano-item-title-icon',
      gicon: Gio.icon_new_for_string(
        `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
          itemType.iconPath
        }`,
      ),
    });
    this.iconContainer.add_child(icon);
    this.settings.connect('changed::icon-pack', () => {
      icon.set_gicon(
        Gio.icon_new_for_string(
          `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
            itemType.iconPath
          }`,
        ),
      );
    });

    this.titleLabel = new St.Label({
      text: itemType.title,
      styleClass: 'pano-item-title',
      xExpand: true,
    });

    this.titleContainer.add_child(this.titleLabel);

    const options: FormatOptions = {
      addSuffix: true,
    };

    if (localeKey !== undefined) {
      const locale = (dateLocale as Record<string, Locale | undefined>)[localeKey];
      if (locale) {
        options.locale = locale;
      }
    }

    this.dateLabel = new St.Label({
      text: formatDistanceToNow(date, options),
      styleClass: 'pano-item-date',
      xExpand: true,
      yExpand: true,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.CENTER,
    });

    this.dateUpdateIntervalId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
      this.dateLabel.set_text(formatDistanceToNow(date, options));

      return GLib.SOURCE_CONTINUE;
    });

    this.titleContainer.add_child(this.dateLabel);

    this.actionContainer = new St.BoxLayout({
      styleClass: 'pano-item-actions',
      xExpand: true,
      yExpand: true,
      xAlign: Clutter.ActorAlign.END,
      yAlign: Clutter.ActorAlign.START,
    });

    const favoriteIcon = new St.Icon({
      styleClass: 'pano-item-action-button-icon',
      iconName: 'starred-symbolic',
    });

    this.favoriteButton = new St.Button({
      styleClass: 'pano-item-action-button pano-item-favorite-button',
      child: favoriteIcon,
    });

    this.favoriteButton.connect('clicked', () => {
      this.emit('on-favorite');
      return Clutter.EVENT_PROPAGATE;
    });

    const removeIcon = new St.Icon({
      styleClass: 'pano-item-action-button-icon pano-item-action-button-remove-icon',
      iconName: 'window-close-symbolic',
    });

    const removeButton = new St.Button({
      styleClass: 'pano-item-action-button pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      this.emit('on-remove');
      return Clutter.EVENT_PROPAGATE;
    });

    this.actionContainer.add_child(this.favoriteButton);
    this.actionContainer.add_child(removeButton);

    this.add_child(this.iconContainer);
    this.add_child(this.titleContainer);
    this.add_child(this.actionContainer);

    this.setStyle();
    this.settings.connect('changed::item-title-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-title-font-size', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-size', this.setStyle.bind(this));
  }

  private setStyle() {
    const itemTitleFontFamily = this.settings.get_string('item-title-font-family');
    const itemTitleFontSize = this.settings.get_int('item-title-font-size');
    const itemDateFontFamily = this.settings.get_string('item-date-font-family');
    const itemDateFontSize = this.settings.get_int('item-date-font-size');
    this.titleLabel.set_style(`font-family: ${itemTitleFontFamily}; font-size: ${itemTitleFontSize}px;`);
    this.dateLabel.set_style(`font-family: ${itemDateFontFamily}; font-size: ${itemDateFontSize}px;`);
  }

  setFavorite(isFavorite: boolean): void {
    if (isFavorite) {
      this.favoriteButton.add_style_pseudo_class('active');
    } else {
      this.favoriteButton.remove_style_pseudo_class('active');
    }
  }

  override destroy(): void {
    if (this.dateUpdateIntervalId) {
      GLib.source_remove(this.dateUpdateIntervalId);
      this.dateUpdateIntervalId = null;
    }
    super.destroy();
  }
}
