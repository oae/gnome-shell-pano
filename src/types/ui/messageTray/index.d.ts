export {
  FocusGrabber,
  MessageTray,
  MOUSE_LEFT_ACTOR_THRESHOLD,
  // Notification,
  NotificationApplicationPolicy,
  NotificationBanner,
  NotificationDestroyedReason,
  NotificationGenericPolicy,
  NotificationPolicy,
  PrivacyScope,
  Source,
  SourceActor,
  State,
  SystemNotificationSource,
  Urgency,
} from '@girs/gnome-shell/src/ui/messageTray';

import type Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import {
  NotificationBanner,
  NotificationDestroyedReason,
  PrivacyScope,
  Source,
  Urgency,
} from '@girs/gnome-shell/src/ui/messageTray';
import GObject from '@girs/gobject-2.0';
import St1 from '@girs/st-12';
export namespace Notification {
  export interface Params {
    gicon?: Gio.Icon | St1.ImageContent | null;
    secondaryGIcon?: Gio.Icon | St1.ImageContent | null;
    bannerMarkup?: boolean;
    clear?: boolean;
    datetime?: GLib.DateTime | null;
    soundName?: string | null;
    soundFile?: Gio.File | null;
  }
}

export class Notification extends GObject.Object {
  public source: Source;
  public title: string;
  public urgency: Urgency;
  public isTransient: boolean;
  public privacyScope: PrivacyScope;
  public forFeedback: boolean;
  public bannerBodyText: string | null;
  public bannerBodyMarkup: boolean;
  public actions: string[];

  protected _soundName: string | null;
  protected _soundFile: Gio.File | null;
  protected _soundPlayed: boolean;

  constructor(source: Source, title: string, banner: string, params: Notification.Params);
  /** @hidden */
  override _init(config?: GObject.Object.ConstructorProperties): void;
  public _init(source: Source, title: string, banner: string, params: Notification.Params): void;

  /**
   * Updates the notification by regenerating its icon and updating
   * the title/banner. If @params.clear is %true, it will also
   * remove any additional actors/action buttons previously added.
   *
   * @param title the new title
   * @param banner the new banner
   * @param params as in the Notification constructor
   */
  public update(title: string, banner: string, params: Notification.Params): void;

  /**
   * @param label the label for the action's button
   * @param callback the callback for the action
   */
  public addAction(label: string, callback: () => void): void;

  public setUrgency(urgency: Urgency): void;

  public setResident(resident: boolean): void;

  public setTransient(isTransient: boolean): void;

  public setForFeedback(forFeedback: boolean): void;

  public setPrivacyScope(privacyScope: PrivacyScope): void;

  public playSound(): void;

  /**
   * Allow customizing the banner UI:
   * the default implementation defers the creation to
   * the source (which will create a {@link NotificationBanner}),
   * so customization can be done by subclassing either
   * Notification or Source
   */
  public createBanner(): NotificationBanner;

  public activate(): void;

  public destroy(reason?: NotificationDestroyedReason): void;
}
