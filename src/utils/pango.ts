import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { ActiveCollection } from '@pano/utils/code/active';
import type { CodeHighlighter, CodeHighlighterMetaData, Language } from '@pano/utils/code/highlight';
import { PygmentsCodeHighlighter } from '@pano/utils/code/pygments';
import { logger } from '@pano/utils/shell';

//TODO: add highlight.js back, if it is installed and can be found via "require()"" or dynamic "await import()""

//TODO: things to do, after more highlighter are added, just add to availableCodeHighlighter, than on changing of one, reevaluate every text item and rescanning it and resetting the metadata. This might take some time, so maybe do it in two steps, and in some places the metadata.highlighter has to be checked, so that we don't use invalid language in one highlighter, other than the one, detecting that language

const debug = logger('pango');

class PromiseCollection extends ActiveCollection<() => Promise<void>> {
  _cancel(promise: () => Promise<void>) {
    // this call results in the cancelled check, so it's like being cancelled
    void promise();
  }
}

const sleep = (ms: number) => {
  let sourceId: null | number;

  return new Promise<void>((resolve) => {
    const callback = () => {
      if (sourceId) {
        GLib.Source.remove(sourceId);
      }

      resolve();
      return GLib.SOURCE_REMOVE;
    };

    sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, callback);
  });
};

// not concurrent. can only run in one thread
// from https://stackoverflow.com/questions/51850236/javascript-scheduler-implementation-using-promises
// but modified to suit our needs

export class PromiseCancelError extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

class TaskScheduler {
  private limit: number;
  private active: number;
  private waiting: PromiseCollection;
  private cancelled: boolean;
  private pool: Array<[() => Promise<void>, string]>;

  constructor(concurrency: number) {
    this.limit = concurrency;
    this.active = 0;
    this.waiting = new PromiseCollection();
    this.cancelled = false;
    this.pool = [];
  }

  push<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this._push(async () => {
        if (this.cancelled) {
          this.active -= 1;
          reject(new PromiseCancelError('Cancelled Promise before starting'));
        }

        const result = await task();

        if (this.cancelled) {
          this.active -= 1;
          reject(new PromiseCancelError('Cancelled Promise after it was run'));
        }
        resolve(result);
      });
    });
  }

  async cancelAll(): Promise<void> {
    this.cancelled = true;
    this.waiting.cancelAll();

    while (this.active !== 0) {
      await sleep(100);
    }

    this.pool = [];
    this.cancelled = false;
  }

  private _push(task: () => Promise<void>): void {
    const { uuid } = this.waiting.add(task);
    this.pool.push([task, uuid]);
    if (this.active < this.limit) {
      void this._execute(this.pool.shift()!);
    }
  }

  private _execute(value: [() => Promise<void>, string]) {
    this.active += 1;
    const [task, uuid] = value;
    const res = task().then(() => {
      this.active -= 1;
      if (this.pool.length > 0 && this.active < this.limit) {
        void this._execute(this.pool.shift()!);
      }
    });

    this.waiting.remove({ value: task, uuid });
    return res;
  }
}

type LoadCallback = () => void | Promise<void>;

export class PangoMarkdown {
  private _detectedHighlighter: CodeHighlighter[] = [];
  private _currentHighlighter: CodeHighlighter | null = null;

  private loadCallbacks: LoadCallback[] = [];
  private _loaded: boolean = false;
  private _scheduler: TaskScheduler;

  public static readonly availableCodeHighlighter: CodeHighlighterMetaData[] = [PygmentsCodeHighlighter.MetaData];

  private readonly _availableCodeHighlighter: CodeHighlighter[];

  constructor(
    ext: ExtensionBase,
    preferredHighlighter: string | null = null,
    settings: Gio.Settings | null = null,
    schedulerConcurrency: number = 4,
  ) {
    this._scheduler = new TaskScheduler(schedulerConcurrency);
    this._availableCodeHighlighter = [new PygmentsCodeHighlighter(ext)];

    // this is fine, since the properties this sets are async safe, alias they are set at the end, so that everything is set when it's needed, and when something uses this class, before it is ready, it will behave correctly and it has a mechanism to add callbacks, after it is finished
    this.detectHighlighter(preferredHighlighter, settings)
      .then(async () => {
        if (settings) {
          this.enableWatch(settings);
        }
        this._loaded = true;
        for (const callback of this.loadCallbacks) {
          await callback();
        }
        this.loadCallbacks = [];
      })
      .catch((err) => {
        debug(`An error occurred in detecting the highlighter: ${err}`);
      });
  }

  onLoad(callback: LoadCallback): void {
    if (this._loaded) {
      void callback();
      return;
    }

    this.loadCallbacks.push(callback);
  }

  get loaded(): boolean {
    return this._loaded;
  }

  get detectedHighlighter() {
    return this._detectedHighlighter;
  }

  get currentHighlighter() {
    return this._currentHighlighter;
  }

  // this is called in the constructor and can be called at any moment later by settings etc.
  public async detectHighlighter(
    preferredHighlighter: string | null = null,
    settings: Gio.Settings | null = null,
  ): Promise<void> {
    // this is to be async safe
    this._detectedHighlighter = [];
    const localDetectedHighlighter = [];
    let currentHighlighter: CodeHighlighter | null = this._currentHighlighter;
    this._currentHighlighter = null;

    for (const codeHighlighter of this._availableCodeHighlighter) {
      if (await codeHighlighter.isInstalled()) {
        if (settings) {
          codeHighlighter.options = settings.get_string(PangoMarkdown.getSchemaKeyForOptions(codeHighlighter));
        }

        localDetectedHighlighter.push(codeHighlighter);

        if (preferredHighlighter === null) {
          if (currentHighlighter === null) {
            currentHighlighter = codeHighlighter;
          }
        } else if (codeHighlighter.name === preferredHighlighter) {
          currentHighlighter = codeHighlighter;
        }
      }
    }

    this._detectedHighlighter = localDetectedHighlighter;
    this._currentHighlighter = currentHighlighter;
  }

  public async detectLanguage(text: string): Promise<Language | undefined> {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return await this._currentHighlighter.detectLanguage(text);
  }

  public async cancelAllScheduled() {
    await this._scheduler.cancelAll();
  }

  public async scheduleMarkupCode(
    language: string,
    text: string,
    characterLength: number,
  ): Promise<string | undefined> {
    if (this._currentHighlighter === null) {
      return undefined;
    }

    return await this._scheduler.push(async () => {
      return await this._currentHighlighter?.markupCode(language, text, characterLength);
    });
  }

  public static getSchemaKeyForOptions(highlighter: CodeHighlighter): string {
    return `${highlighter.name}-options`;
  }

  public static readonly codeHighlighterKey = 'code-highlighter';
  public static readonly enabledKey = 'code-highlighter-enabled';

  private enableWatch(settings: Gio.Settings) {
    const settingsChanged = async () => {
      const isEnabled = settings.get_boolean(PangoMarkdown.enabledKey);
      if (!isEnabled) {
        this._currentHighlighter = null;
        return;
      }

      const highlighterValue = settings.get_uint(PangoMarkdown.codeHighlighterKey);

      await this.detectHighlighter(PangoMarkdown.availableCodeHighlighter[highlighterValue]!.name);
    };

    settings.connect(`changed::${PangoMarkdown.enabledKey}`, settingsChanged);

    settings.connect(`changed::${PangoMarkdown.codeHighlighterKey}`, settingsChanged);

    for (const codeHighlighter of this._availableCodeHighlighter) {
      const schemaKey = `changed::${PangoMarkdown.getSchemaKeyForOptions(codeHighlighter)}`;
      settings.connect(schemaKey, () => {
        if (this._currentHighlighter?.name === codeHighlighter.name) {
          this._currentHighlighter.options = settings.get_string(schemaKey);
        }
      });

      codeHighlighter;
    }
  }

  public stopProcesses() {
    for (const highlighter of this._detectedHighlighter) {
      highlighter.stopProcesses();
    }

    void this._scheduler.cancelAll();
  }
}
