import { ActorAlign, AlignAxis, AlignConstraint } from '@gi-types/clutter10';
import { File } from '@gi-types/gio2';
import { BoxLayout, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtension, getImagesPath } from '@pano/utils/shell';
import prettyBytes from 'pretty-bytes';

const NO_IMAGE_FOUND_FILE_NAME = 'no-image-found.svg';

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-image');

    const { width, height, size }: { width: number; height: number; size: number } = JSON.parse(
      dbItem.metaData || '{}',
    );

    let imageFilePath = `file://${getImagesPath()}/${this.dbItem.content}.png`;
    let backgroundSize = 'contain';
    const imageFile = File.new_for_uri(imageFilePath);
    if (!imageFile.query_exists(null)) {
      imageFilePath = `file://${getCurrentExtension().path}/images/${NO_IMAGE_FOUND_FILE_NAME}`;
      backgroundSize = 'cover';
    }

    this.body.style = `background-image: url(${imageFilePath}); background-size: ${backgroundSize};`;

    const metaContainer = new BoxLayout({
      style_class: 'pano-item-body-meta-container',
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.END,
      x_align: ActorAlign.FILL,
    });

    const resolutionContainer = new BoxLayout({
      vertical: false,
      x_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style_class: 'pano-item-body-image-resolution-container',
    });

    const resolutionTitle = new Label({
      text: 'Resolution',
      x_align: ActorAlign.START,
      x_expand: true,
      style_class: 'pano-item-body-image-meta-title',
    });
    const resolutionValue = new Label({
      text: `${width} x ${height}`,
      x_align: ActorAlign.END,
      x_expand: false,
      style_class: 'pano-item-body-image-meta-value',
    });
    resolutionContainer.add_child(resolutionTitle);
    resolutionContainer.add_child(resolutionValue);

    const sizeContainer = new BoxLayout({
      vertical: false,
      x_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style_class: 'pano-item-body-image-size-container',
    });

    const sizeLabel = new Label({
      text: 'Size',
      x_align: ActorAlign.START,
      x_expand: true,
      style_class: 'pano-item-body-image-meta-title',
    });
    const sizeValue = new Label({
      text: prettyBytes(size),
      x_align: ActorAlign.END,
      x_expand: false,
      style_class: 'pano-item-body-image-meta-value',
    });
    sizeContainer.add_child(sizeLabel);
    sizeContainer.add_child(sizeValue);

    metaContainer.add_child(resolutionContainer);
    metaContainer.add_child(sizeContainer);
    metaContainer.add_constraint(
      new AlignConstraint({
        source: this,
        align_axis: AlignAxis.Y_AXIS,
        factor: 0.001,
      }),
    );

    this.body.add_child(metaContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    const imageFile = File.new_for_path(`${getImagesPath()}/${this.dbItem.content}.png`);
    if (!imageFile.query_exists(null)) {
      return;
    }

    const [bytes] = imageFile.load_bytes(null);
    const data = bytes.get_data();

    if (!data) {
      return;
    }

    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.IMAGE,
        value: data,
      }),
    );
  }
}
