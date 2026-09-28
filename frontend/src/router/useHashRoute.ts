import { useCallback, useEffect, useState } from "react";
import { DEFAULT_ROUTE, routes } from "./routes";

const KNOWN = new Set(routes.map((route) => route.route));

const readHash = (): string => {
  const raw = window.location.hash.replace(/^#/, "");
  return KNOWN.has(raw) ? raw : DEFAULT_ROUTE;
};

/**
 * 极简 hash 路由：无需引入第三方路由库即可满足四个页面切换，
 * 且刷新后停留在当前页，配合 Nginx 的 try_files 支持直接访问。
 */
export function useHashRoute(): [string, (next: string) => void] {
  const [path, setPath] = useState<string>(readHash);

  useEffect(() => {
    const onHashChange = () => setPath(readHash());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: string) => {
    if (window.location.hash !== `#${next}`) window.location.hash = next;
    setPath(next);
  }, []);

  return [path, navigate];
}
