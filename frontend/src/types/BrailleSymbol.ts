import type { SymbolCategory } from "../constants/SymbolCategory";
import type { DifficultyLevel } from "../constants/DifficultyLevel";

export interface BrailleSymbol {
  id: number;
  /** 6 点盲文点位，数字 1-6，按国标排列：左列 1/2/3，右列 4/5/6 */
  cell_pattern: string;
  /** 字符展示，如 a / 1 / ，*/
  letter: string;
  /** 读音提示，同时用于听写模拟 */
  pinyin: string;
  category: SymbolCategory;
  difficulty: DifficultyLevel;
  audio_hint_key: string;
}
