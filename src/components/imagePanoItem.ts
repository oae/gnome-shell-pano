import { ContentGravity, Stage } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { TextureCache, ThemeContext } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getImagesPath } from '@pano/utils/shell';

const global = Global.get();

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    this.body.add_style_class_name('pano-item-body-image');
    const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;

    const actor = TextureCache.get_default().load_file_async(
      File.new_for_path(`${getImagesPath()}/${this.dbItem.content}.png`),
      -1,
      220,
      scaleFactor,
      this.body.get_resource_scale(),
    );
    if (actor) {
      actor.content_gravity = ContentGravity.RESIZE_ASPECT;
      actor.margin_top = 10;
      actor.margin_bottom = 10;
      actor.margin_right = 0;
      actor.margin_left = 0;
      this.body.add_child(actor);
    }

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
