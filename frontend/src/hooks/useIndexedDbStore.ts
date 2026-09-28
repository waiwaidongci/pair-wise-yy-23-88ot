import { useEffect } from "react";

type LoadableStore = {
  load: (force?: boolean) => Promise<void>;
  loaded: boolean;
};

// 页面挂载时从本机 IndexedDB 同步实体数据，支持传入多个 store
export function useIndexedDbStore(stores: LoadableStore | LoadableStore[], force = false): void {
  const list = Array.isArray(stores) ? stores : [stores];
  useEffect(() => {
    let active = true;
    Promise.all(list.map((store) => (active ? store.load(force) : Promise.resolve()))).catch((error) => {
      console.error("加载本机数据失败", error);
    });
    return () => {
      active = false;
    };
    // 仅在挂载时触发一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [force]);
}
