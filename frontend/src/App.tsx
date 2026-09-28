import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { useHashRoute } from "./router/useHashRoute";
import { ensureSeedData } from "./api/bootstrap";
import { LocalDataError } from "./utils/errors";
import { LearnPage } from "./pages/LearnPage";
import { PracticePage } from "./pages/PracticePage";
import { MistakesPage } from "./pages/MistakesPage";
import { ProgressPage } from "./pages/ProgressPage";
import { useMistakeRehearsalStore } from "./stores/MistakeRehearsalStore";
import type { MistakeReason } from "./constants/MistakeReason";

export default function App() {
  const [route, navigate] = useHashRoute();
  const [bootError, setBootError] = useState<string>("");
  // 必须等种子写入完成后再挂载页面，避免页面 store 在空库上抢先加载
  const [ready, setReady] = useState(false);
  const requestRehearsal = useMistakeRehearsalStore((state) => state.request);

  useEffect(() => {
    let active = true;
    ensureSeedData()
      .catch((error) => {
        if (active) setBootError(error instanceof LocalDataError ? error.message : "本机数据初始化失败");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRehearse = (symbolIds: number[], reason: MistakeReason | "ALL") => {
    requestRehearsal(symbolIds, reason);
    navigate("/practice");
  };

  return (
    <AppShell active={route} onNavigate={navigate}>
      {bootError && <div className="boot-error">{bootError}</div>}
      {!ready ? (
        <main className="page">
          <p className="muted">正在载入本机盲文数据…</p>
        </main>
      ) : (
        <>
          {route === "/learn" && <LearnPage />}
          {route === "/practice" && <PracticePage />}
          {route === "/mistakes" && <MistakesPage onRehearse={handleRehearse} />}
          {route === "/progress" && <ProgressPage />}
        </>
      )}
    </AppShell>
  );
}
