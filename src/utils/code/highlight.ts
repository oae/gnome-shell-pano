export type Language = {
  relevance: number;
  language: string;
};

export type CodeHighlighterType = 'CommandLine' | 'Integrated' | 'JSModule';

export abstract class CodeHighlighter {
  readonly name: string;
  readonly type: CodeHighlighterType;

  constructor(name: string, type: CodeHighlighterType) {
    this.name = name;
    this.type = type;
  }

  abstract isInstalled(): boolean;

  abstract detectLanguage(text: string): Language | undefined;

  abstract markupCode(language: string, text: string, characterLength: number): string | undefined;
}
