import { useEffect, useRef, useState } from "react";
import { ensureSeeded } from "../api/bootstrap";
import { useBrailleSymbolStore } from "../stores/BrailleSymbolStore";
import { useLessonStore } from "../stores/LessonStore";
import { usePracticeSessionStore } from "../stores/PracticeSessionStore";
import { useAnswerRecordStore } from "../stores/AnswerRecordStore";

export interface LocalDatabaseState {
  ready: boolean;
  errors: string[];
  /** 播种并加载全部本机数据；离开页面再回来时数据直接来自 IndexedDB。 */
  reload: () => Promise<void>;
}

/**
 * 应用引导 hook：负责 IndexedDB 首次播种与四个 store 的装载。
 * 数据存取（api/database）、状态管理（stores）与展示（pages）分层，
 * 本 hook 只做编排，不承载业务判题逻辑。
 */
export function useIndexedDbStore(): LocalDatabaseState {
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const booted = useRef(false);

  const symbolStore = useBrailleSymbolStore();
  const lessonStore = useLessonStore();
  const sessionStore = usePracticeSessionStore();
  const recordStore = useAnswerRecordStore();

  const reload = async () => {
    setReady(false);
    await ensureSeeded();
    const results = await Promise.allSettled([
      symbolStore.load(true),
      lessonStore.load(true),
      sessionStore.load(true),
      recordStore.load(true)
    ]);
    const messages = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) => String(result.reason));
    setErrors(messages);
    setReady(true);
  };

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    reload().catch((cause) => setErrors([String(cause)]));
    // 仅在应用挂载时播种一次。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, errors, reload };
}
