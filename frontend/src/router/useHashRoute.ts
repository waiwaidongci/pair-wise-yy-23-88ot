import { useEffect, useState } from "react";
import { DEFAULT_ROUTE, routes, type AppRoute } from "./routes";

const routeSet = new Set<string>(routes.map((route) => route.route));

function readHashRoute(): AppRoute {
  const path = window.location.hash.replace(/^#/, "") || DEFAULT_ROUTE;
  return routeSet.has(path) ? (path as AppRoute) : DEFAULT_ROUTE;
}

export function useHashRoute(): [AppRoute, (route: AppRoute) => void] {
  const [route, setRoute] = useState<AppRoute>(readHashRoute);

  useEffect(() => {
    const sync = () => setRoute(readHashRoute());
    window.addEventListener("hashchange", sync);
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    if (window.location.hash !== `#${nextRoute}`) window.location.hash = nextRoute;
  };

  return [route, navigate];
}
