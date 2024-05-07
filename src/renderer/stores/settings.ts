import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  chromeUrl: string | null;
  token: string | null;

  setChromeUrl: (url: string) => void;
  setToken: (token: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      chromeUrl: null,
      token: null,

      setChromeUrl(url) {
        set({ chromeUrl: url });
      },
      setToken(token) {
        set({ token: token });
      },
    }),
    { name: "settings" }
  )
);
