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
    return null;
  }

  return <>{children}</>;
}
