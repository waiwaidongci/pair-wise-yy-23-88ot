import { createRoot } from "react-dom/client";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { routes } from "./router/routes";
import { useHashRoute } from "./router/useHashRoute";
import { useIndexedDbStore } from "./hooks/useIndexedDbStore";
import { LearnPage } from "./pages/LearnPage";
import { PracticePage } from "./pages/PracticePage";
import { MistakesPage } from "./pages/MistakesPage";
import { ProgressPage } from "./pages/ProgressPage";
import "./styles.css";

/** Material UI 主题：主色与项目墨绿/赭金配色保持一致。 */
const theme = createTheme({
  palette: { primary: { main: "#274335" }, secondary: { main: "#d39b46" } },
  typography: { fontFamily: '"Aptos","PingFang SC",system-ui,sans-serif' }
});

function pageOf(path: string) {
  switch (path) {
    case "/learn":
      return <LearnPage />;
    case "/practice":
      return <PracticePage />;
    case "/mistakes":
      return <MistakesPage />;
    case "/progress":
      return <ProgressPage />;
    default:
      return <LearnPage />;
  }
}

function App() {
  const [active, navigate] = useHashRoute();
  const db = useIndexedDbStore();

  return (
    <div className="shell">
      <aside>
        <div className="brand">盲文点字学习训练器</div>
        <nav>
          {routes.map((route) => (
            <button
              key={route.route}
              className={active === route.route ? "active" : ""}
              onClick={() => navigate(route.route)}
            >
              {route.name}
            </button>
          ))}
        </nav>
        <p className="side-note">数据保存在本机浏览器 IndexedDB</p>
      </aside>
      {!db.ready ? (
        <main className="page">
          <section className="panel boot-panel">
            <h1>正在装载本机课程数据…</h1>
            <p className="muted">首次打开会把点字字符与课程写入本机存储。</p>
          </section>
        </main>
      ) : (
        pageOf(active)
      )}
      {db.ready && db.errors.length > 0 && (
        <div className="error-banner" role="alert">
          部分本机数据读取失败：{db.errors.join("；")}
          <button type="button" className="btn" onClick={() => void db.reload()}>重试</button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
