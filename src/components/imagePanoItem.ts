import Gio from '@girs/gio-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, ClipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getImagesPath } from '@pano/utils/shell';

const NO_IMAGE_FOUND_FILE_NAME = 'no-image-found.svg';

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  private imageItemSettings: Gio.Settings;
  private ext: ExtensionBase;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super(ext, clipboardManager, dbItem);

    this.ext = ext;

    this.imageItemSettings = this.settings.get_child('image-item');

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
  }

  private setStyle() {
    const headerBgColor = this.imageItemSettings.get_string('header-bg-color');
    const headerColor = this.imageItemSettings.get_string('header-color');

    let imageFilePath = `file://${getImagesPath(this.ext)}/${this.dbItem.content}.png`;
    const imageFile = Gio.File.new_for_uri(imageFilePath);
    if (!imageFile.query_exists(null)) {
      imageFilePath = `file://${this.ext.path}/images/${NO_IMAGE_FOUND_FILE_NAME}`;
    }

    this.header.style = `background-color: ${headerBgColor}; color: ${headerColor};`;
    this.body.set_style(`background-image: url(${imageFilePath}); background-size: cover;`);
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
