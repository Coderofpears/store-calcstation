import { ReactNode, useEffect, useState } from "react";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      return localStorage.getItem("showAdmin") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onShow = () => setVisible(true);
    window.addEventListener("showadmin", onShow as unknown as EventListener);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "showAdmin" && e.newValue === "1") setVisible(true);
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("showadmin", onShow as unknown as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!visible) {
    return (
      <main className="container py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Admin center is hidden. Open DevTools and run:
          <code className="mx-1 rounded bg-muted px-1.5 py-0.5">showadmin()</code>
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
