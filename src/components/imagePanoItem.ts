import { ContentGravity, Stage } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { TextureCache, ThemeContext } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { PanoItem } from './panoItem';

const global = Global.get();

@registerGObjectClass
export class ImagePanoItem extends PanoItem {
  constructor(content: Uint8Array, date: Date) {
    super(PanoItemTypes.IMAGE, date);

    this.body.style_class = 'pano-item-body pano-item-body-image';

    const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;
    const [file, ioStream] = File.new_tmp('XXXXXX.png');
    ioStream.output_stream.write_bytes(content, null);
    ioStream.close(null);
    const actor = TextureCache.get_default().load_file_async(
      file,
      -1,
      225,
      scaleFactor,
      this.body.get_resource_scale(),
    );
    if (actor) {
      actor.content_gravity = ContentGravity.RESIZE_ASPECT;
      this.body.add_child(actor);
    }
  }
}
