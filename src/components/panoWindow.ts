import { ActorAlign, AnimationMode, EVENT_PROPAGATE, KeyEvent, KEY_Escape } from '@imports/clutter10';
import { BoxLayout, Entry, Icon } from '@imports/st1';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getMonitorConstraint, logger } from '@pano/utils/shell';
import hljs from 'highlight.js';
import { CodePanoItem } from './codePanoItem';
import { ImagePanoItem } from './imagePanoItem';
import { LinkPanoItem } from './linkPanoItem';
import { PanoItem } from './panoItem';
import { PanoScrollView } from './panoScrollView';
import { TextPanoItem } from './textPanoItem';

const debug = logger('pano-window');

const SUPPORTED_LANGUAGES = [
  'python',
  'java',
  'javascript',
  'csharp',
  'cpp',
  'c',
  'php',
  'typescript',
  'swift',
  'kotlin',
  'go',
  'rust',
  'ruby',
  'scala',
  'dart',
  'lua',
  'groovy',
  'perl',
  'julia',
  'haskell',
];

@registerGObjectClass
export class PanoWindow extends BoxLayout {
  private scrollView: PanoScrollView;
  private search: Entry;

  constructor() {
    super({
      name: 'pano-window',
      constraints: getMonitorConstraint(),
      style_class: 'pano-window',
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.END,
      visible: false,
      vertical: true,
      reactive: true,
      opacity: 0,
      can_focus: true,
    });
    this.scrollView = new PanoScrollView();
    const searchBox = new BoxLayout({
      x_align: ActorAlign.CENTER,
      vertical: false,
    });
    this.search = new Entry({
      can_focus: true,
      hint_text: 'Type to search',
      track_hover: true,
      width: 300,
      primary_icon: new Icon({
        style_class: 'search-entry-icon',
        icon_name: 'edit-find-symbolic',
      }),
    });
    searchBox.add_child(this.search);
    this.add_actor(searchBox);
    this.add_actor(this.scrollView);
    this.scrollView.addItem(new PanoItem(PanoItemTypes.CODE, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.FILE, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.IMAGE, new Date()));
    this.scrollView.addItem(new PanoItem(PanoItemTypes.LINK, new Date()));

    clipboardManager.connect('changed', this.onNewItem.bind(this));
  }

  private onNewItem(_: any, { content }: ClipboardContent) {
    // debug(`got new item with the type: ${content.type}`);
    switch (content.type) {
      case ContentType.FILE:
        // debug(`files: ${JSON.stringify(content.value, null, 4)}`);
        break;
      case ContentType.IMAGE:
        this.scrollView.addItem(new ImagePanoItem(content.value, new Date()));
        break;
      case ContentType.TEXT:
        const linkRegex =
          /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)$/g;

        if (linkRegex.test(content.value)) {
          this.scrollView.addItem(new LinkPanoItem(content.value, new Date()));
          return;
        }
        const highlightResult = hljs.highlightAuto(content.value.slice(0, 1000), SUPPORTED_LANGUAGES);
        debug(`rel: ${highlightResult.relevance} ${highlightResult.language}`);
        if (highlightResult.relevance < 4) {
          this.scrollView.addItem(new TextPanoItem(content.value, new Date()));
        } else {
          this.scrollView.addItem(new CodePanoItem(content.value, new Date()));
        }
        break;

      default:
        break;
    }
  }

  toggle(): void {
    this.is_visible() ? this.hide() : this.show();
  }

  override show() {
    this.clear_constraints();
    this.add_constraint(getMonitorConstraint());
    super.show();
    this.search.grab_key_focus();
    this.ease({
      opacity: 255,
      duration: 250,
      mode: AnimationMode.EASE_OUT_QUAD,
    });
    debug('showing pano');
  }

  override hide() {
    this.ease({
      opacity: 0,
      duration: 200,
      mode: AnimationMode.EASE_OUT_QUAD,
      onComplete: () => {
        super.hide();
      },
    });
    debug('hiding pano');
  }

  override vfunc_key_focus_out(): void {
    // this.hide();
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    if (event.keyval === KEY_Escape) {
      this.hide();
    }

    return EVENT_PROPAGATE;
  }
}
