export interface Lesson {
  id: number;
  title: string;
  symbol_ids: number[];
  /** 学习阶段，如“入门 / 基础 / 进阶” */
  stage: string;
  estimated_minutes: number;
  unlock_rule: string;
}
