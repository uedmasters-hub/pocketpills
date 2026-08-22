import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  applyDesignTokens,
  fetchLiveDesign,
  type DesignVersion,
} from "@/lib/designSystemApi";

type LiveCtx = {
  live: DesignVersion | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const Ctx = createContext<LiveCtx>({ live: null, loading: true, refresh: async () => {} });

export function DesignSystemLiveProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<DesignVersion | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetchLiveDesign();
      setLive(res.version);
      applyDesignTokens(res.version?.tokens);
    } catch {
      setLive(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return <Ctx.Provider value={{ live, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useDesignSystemLive() {
  return useContext(Ctx);
}
