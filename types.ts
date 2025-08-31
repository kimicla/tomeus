
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TranslatedBlock {
  originalText: string;
  translatedText: string;
  boundingBox: BoundingBox;
}

export interface TranslationResult {
  translationBlocks: TranslatedBlock[];
  formattedTranslation: string;
}

export interface Language {
    value: string;
    label: string;
}