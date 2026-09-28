import type { ReactNode } from "react";
import { routes } from "../router/routes";
import { useHashRoute } from "../router/useHashRoute";

interface AppShellProps {
  active: ReturnType<typeof useHashRoute>[0];
  onNavigate: ReturnType<typeof useHashRoute>[1];
  children: ReactNode;
}

export function AppShell({ active, onNavigate, children }: AppShellProps) {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          盲文点字
          <br />
          学习训练器
        </div>
        <nav>
          {routes.map((route) => (
            <button
              key={route.route}
              className={active === route.route ? "active" : ""}
              onClick={() => onNavigate(route.route)}
            >
              {route.name}
            </button>
          ))}
        </nav>
        <p className="shell-foot">数据保存在本机 IndexedDB</p>
      </aside>
      {children}
    </div>
  );
}
