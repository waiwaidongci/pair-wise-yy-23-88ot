import { PracticeModeText } from "./PracticeMode";
import { SymbolCategoryText } from "./SymbolCategory";
import { MasteryLevelText } from "./MasteryLevel";
import { MistakeReasonText } from "./MistakeReason";

/** 状态文案聚合：页面与共享组件统一从这里读取枚举文案。 */
export const STATUS_TEXT = {
  PracticeMode: PracticeModeText,
  SymbolCategory: SymbolCategoryText,
  MasteryLevel: MasteryLevelText,
  MistakeReason: MistakeReasonText
} as const;
