import type { SymbolCategory } from "../constants/SymbolCategory";

/**
 * 点字字符。
 * cell_pattern 使用盲文点位编号序列，逗号分隔，例如 "1,2,4"；空串表示空白方。
 * 点位编号约定：左上 1、左中 2、左下 3、右上 4、右中 5、右下 6。
 */
export interface BrailleSymbol {
  id: number;
  cell_pattern: string;
  letter: string;
  pinyin: string;
  category: SymbolCategory;
  difficulty: number;
  audio_hint_key: string;
}
