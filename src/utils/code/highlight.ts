export type Language = {
  relevance: number;
  language: string;
};

export type CodeHighlighterType = 'CommandLine' | 'JSModule';

export type DropDownOption = {
  type: 'dropdown';
  values: string[];
  title: string;
  subtitle: string;
  defaultValue: string | number;
  searchEnabled?: boolean;
};

export type OptionForSettings = DropDownOption;

export type OptionsForSettings = Record<string, OptionForSettings>;

export type CodeHighlighterMetaData = {
  name: string;
  type: CodeHighlighterType;
};

export abstract class CodeHighlighter {
  readonly name: string;
  readonly type: CodeHighlighterType;
  protected installed: boolean;

  constructor(metaData: CodeHighlighterMetaData, installed = false) {
    this.name = metaData.name;
    this.type = metaData.type;
    this.installed = installed;
  }

  abstract isInstalled(): Promise<boolean>;

  abstract detectLanguage(text: string): Promise<Language | undefined>;

  abstract markupCode(language: string, text: string, characterLength: number): Promise<string | undefined>;

  abstract getOptionsForSettings(_: (str: string) => string): Promise<OptionsForSettings>;

  abstract set options(options: string);

  abstract get options(): string;

  abstract stopProcesses(): void;
}
