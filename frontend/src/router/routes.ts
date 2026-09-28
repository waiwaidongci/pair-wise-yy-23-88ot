export interface AppRoute {
  name: string;
  route: string;
}

export const routes: readonly AppRoute[] = [
  { name: "学习卡片", route: "/learn" },
  { name: "练习模式", route: "/practice" },
  { name: "错题本", route: "/mistakes" },
  { name: "学习进度", route: "/progress" }
] as const;

export const DEFAULT_ROUTE = routes[0].route;
