import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getImagesPath } from '@pano/utils/shell';
import prettyBytes from 'pretty-bytes';

const NO_IMAGE_FOUND_FILE_NAME = 'no-image-found.svg';

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  private imageItemSettings: Gio.Settings;
  private metaContainer: St1.BoxLayout;
  private resolutionTitle: St1.Label;
  private resolutionValue: St1.Label;
  private sizeLabel: St1.Label;
  private sizeValue: St1.Label;
  private ext: ExtensionBase;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.ext = ext;

    this.body.add_style_class_name('pano-item-body-image');

    this.imageItemSettings = this.settings.get_child('image-item');

    const { width, height, size }: { width: number; height: number; size: number } = JSON.parse(
      dbItem.metaData || '{}',
    );

    this.metaContainer = new St1.BoxLayout({
      style_class: 'pano-item-body-meta-container',
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: Clutter.ActorAlign.END,
      x_align: Clutter.ActorAlign.FILL,
    });

    const resolutionContainer = new St1.BoxLayout({
      vertical: false,
      x_expand: true,
      y_align: Clutter.ActorAlign.FILL,
      x_align: Clutter.ActorAlign.FILL,
      style_class: 'pano-item-body-image-resolution-container',
    });

    this.resolutionTitle = new St1.Label({
      text: 'Resolution',
      x_align: Clutter.ActorAlign.START,
      x_expand: true,
      style_class: 'pano-item-body-image-meta-title',
    });
    this.resolutionValue = new St1.Label({
      text: `${width} x ${height}`,
      x_align: Clutter.ActorAlign.END,
      x_expand: false,
      style_class: 'pano-item-body-image-meta-value',
    });
    resolutionContainer.add_child(this.resolutionTitle);
    resolutionContainer.add_child(this.resolutionValue);

    const sizeContainer = new St1.BoxLayout({
      vertical: false,
      x_expand: true,
      y_align: Clutter.ActorAlign.FILL,
      x_align: Clutter.ActorAlign.FILL,
      style_class: 'pano-item-body-image-size-container',
    });

    this.sizeLabel = new St1.Label({
      text: 'Size',
      x_align: Clutter.ActorAlign.START,
      x_expand: true,
      style_class: 'pano-item-body-image-meta-title',
    });
    this.sizeValue = new St1.Label({
      text: prettyBytes(size),
      x_align: Clutter.ActorAlign.END,
      x_expand: false,
      style_class: 'pano-item-body-image-meta-value',
    });
    sizeContainer.add_child(this.sizeLabel);
    sizeContainer.add_child(this.sizeValue);

    this.metaContainer.add_child(resolutionContainer);
    this.metaContainer.add_child(sizeContainer);
    this.metaContainer.add_constraint(
      new Clutter.AlignConstraint({
        source: this,
        align_axis: Clutter.AlignAxis.Y_AXIS,
        factor: 0.001,
      }),
    );

    this.body.add_child(this.metaContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.imageItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.imageItemSettings.get_string('header-bg-color');
    const headerColor = this.imageItemSettings.get_string('header-color');
    const bodyBgColor = this.imageItemSettings.get_string('body-bg-color');
    const metadataBgColor = this.imageItemSettings.get_string('metadata-bg-color');
    const metadataColor = this.imageItemSettings.get_string('metadata-color');
    const metadataFontFamily = this.imageItemSettings.get_string('metadata-font-family');
    const metadataFontSize = this.imageItemSettings.get_int('metadata-font-size');

    let imageFilePath = `file://${getImagesPath(this.ext)}/${this.dbItem.content}.png`;
    let backgroundSize = 'contain';
    const imageFile = Gio.File.new_for_uri(imageFilePath);
    if (!imageFile.query_exists(null)) {
      imageFilePath = `file://${this.ext.path}/images/${NO_IMAGE_FOUND_FILE_NAME}`;
      backgroundSize = 'cover';
    }

    this.body.set_style(
      `background-color: ${bodyBgColor}; background-image: url(${imageFilePath}); background-size: ${backgroundSize};`,
    );

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.resolutionTitle.set_style(
      `color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`,
    );
    this.resolutionValue.set_style(
      `color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px; font-weight: bold;`,
    );
    this.sizeLabel.set_style(
      `color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`,
    );
    this.sizeValue.set_style(
      `color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px; font-weight: bold;`,
    );
    this.metaContainer.set_style(`background-color: ${metadataBgColor};`);
  }

  private setClipboardContent(): void {
    const imageFile = Gio.File.new_for_path(`${getImagesPath(this.ext)}/${this.dbItem.content}.png`);
    if (!imageFile.query_exists(null)) {
      return;
    }

    const [bytes] = imageFile.load_bytes(null);
    const data = bytes.get_data();

    if (!data) {
      return;
    }

    this.clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.IMAGE,
        value: data,
      }),
    );
  }
}
