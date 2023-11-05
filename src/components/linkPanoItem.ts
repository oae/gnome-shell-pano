import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { getV13ButtonEvent, getV13KeyEvent } from '@pano/utils/compatibility';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCachePath, gettext, openLinkInBrowser } from '@pano/utils/shell';

const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.svg';

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  private linkItemSettings: Gio.Settings;
  private metaContainer: St1.BoxLayout;
  private titleLabel: St1.Label;
  private descriptionLabel: St1.Label;
  private linkLabel: St1.Label;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);
    const _ = gettext(ext);
    this.linkItemSettings = this.settings.get_child('link-item');

    const { title, description, image } = JSON.parse(dbItem.metaData || '{"title": "", "description": ""}');
    let titleText: string = title;
    let descriptionText: string = description;

    if (!title) {
      titleText = GLib.uri_parse(dbItem.content, GLib.UriFlags.NONE).get_host() || this.dbItem.content;
    } else {
      titleText = decodeURI(title);
    }

    if (!description) {
      descriptionText = _('No Description');
    } else {
      descriptionText = decodeURI(description);
    }

    this.body.add_style_class_name('pano-item-body-link');

    this.metaContainer = new St1.BoxLayout({
      style_class: 'pano-item-body-meta-container',
      vertical: true,
      x_expand: true,
      y_expand: false,
      y_align: Clutter.ActorAlign.END,
      x_align: Clutter.ActorAlign.FILL,
    });

    this.titleLabel = new St1.Label({
      text: titleText,
      style_class: 'link-title-label',
    });

    this.descriptionLabel = new St1.Label({
      text: descriptionText,
      style_class: 'link-description-label',
    });
    this.descriptionLabel.clutter_text.single_line_mode = true;

    this.linkLabel = new St1.Label({
      text: this.dbItem.content,
      style_class: 'link-label',
    });

    let imageFilePath = `file:///${ext.path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`;
    if (image && Gio.File.new_for_uri(`file://${getCachePath(ext)}/${image}.png`).query_exists(null)) {
      imageFilePath = `file://${getCachePath(ext)}/${image}.png`;
    }

    const imageContainer = new St1.BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.FILL,
      x_align: Clutter.ActorAlign.FILL,
      style_class: 'image-container',
      style: `background-image: url(${imageFilePath});`,
    });

    this.metaContainer.add_child(this.titleLabel);
    this.metaContainer.add_child(this.descriptionLabel);
    this.metaContainer.add_child(this.linkLabel);

    this.body.add_child(imageContainer);
    this.body.add_child(this.metaContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.linkItemSettings.connect('changed', this.setStyle.bind(this));

    const openLinkIcon = new St1.Icon({
      icon_name: 'web-browser-symbolic',
      style_class: 'pano-item-action-button-icon',
    });

    const openLinkButton = new St1.Button({
      style_class: 'pano-item-action-button pano-item-open-link-button',
      child: openLinkIcon,
    });

    openLinkButton.connect('clicked', () => {
      this.emit('activated');
      openLinkInBrowser(this.dbItem.content);
      return Clutter.EVENT_PROPAGATE;
    });

    if (this.settings.get_boolean('open-links-in-browser')) {
      this.header.actionContainer.insert_child_at_index(openLinkButton, 0);
    }

    this.settings.connect('changed::open-links-in-browser', () => {
      if (this.header.actionContainer.get_child_at_index(0) === openLinkButton) {
        this.header.actionContainer.remove_child(openLinkButton);
      }

      if (this.settings.get_boolean('open-links-in-browser')) {
        this.header.actionContainer.insert_child_at_index(openLinkButton, 0);
      }
    });
  }

  private setStyle() {
    const headerBgColor = this.linkItemSettings.get_string('header-bg-color');
    const headerColor = this.linkItemSettings.get_string('header-color');
    const bodyBgColor = this.linkItemSettings.get_string('body-bg-color');
    const metadataBgColor = this.linkItemSettings.get_string('metadata-bg-color');
    const metadataTitleColor = this.linkItemSettings.get_string('metadata-title-color');
    const metadataDescriptionColor = this.linkItemSettings.get_string('metadata-description-color');
    const metadataLinkColor = this.linkItemSettings.get_string('metadata-link-color');
    const metadataTitleFontFamily = this.linkItemSettings.get_string('metadata-title-font-family');
    const metadataDescriptionFontFamily = this.linkItemSettings.get_string('metadata-description-font-family');
    const metadataLinkFontFamily = this.linkItemSettings.get_string('metadata-link-font-family');
    const metadataTitleFontSize = this.linkItemSettings.get_int('metadata-title-font-size');
    const metadataDescriptionFontSize = this.linkItemSettings.get_int('metadata-description-font-size');
    const metadataLinkFontSize = this.linkItemSettings.get_int('metadata-link-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor};`);
    this.metaContainer.set_style(`background-color: ${metadataBgColor};`);
    this.titleLabel.set_style(
      `color: ${metadataTitleColor}; font-family: ${metadataTitleFontFamily}; font-size: ${metadataTitleFontSize}px;`,
    );
    this.descriptionLabel.set_style(
      `color: ${metadataDescriptionColor}; font-family: ${metadataDescriptionFontFamily}; font-size: ${metadataDescriptionFontSize}px;`,
    );
    this.linkLabel.set_style(
      `color: ${metadataLinkColor}; font-family: ${metadataLinkFontFamily}; font-size: ${metadataLinkFontSize}px;`,
    );
  }

  private setClipboardContent(): void {
    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }

  override vfunc_key_press_event(_event: Clutter.KeyEvent): boolean {
    super.vfunc_key_press_event(_event);
    const event = getV13KeyEvent(_event);
    if (
      this.settings.get_boolean('open-links-in-browser') &&
      event.get_state() === Clutter.ModifierType.CONTROL_MASK &&
      (event.get_key_symbol() === Clutter.KEY_Return ||
        event.get_key_symbol() === Clutter.KEY_ISO_Enter ||
        event.get_key_symbol() === Clutter.KEY_KP_Enter)
    ) {
      openLinkInBrowser(this.dbItem.content);
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(_event: Clutter.ButtonEvent): boolean {
    super.vfunc_button_release_event(_event);

    const event = getV13ButtonEvent(_event);
    if (
      event.get_button() === 1 &&
      event.get_state() === Clutter.ModifierType.CONTROL_MASK &&
      this.settings.get_boolean('open-links-in-browser')
    ) {
      openLinkInBrowser(this.dbItem.content);
    }

    return Clutter.EVENT_PROPAGATE;
  }
}
