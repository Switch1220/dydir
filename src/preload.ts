import { contextBridge, ipcRenderer } from "electron/renderer";
import { getArticleContents, JournalRankings, scrapeRankings } from "./scrape";
// import { generateContent } from "./gemini";
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// declare const api: typeof;

const api = {
  openChromeUrlDialog: () => ipcRenderer.invoke("dialog:chrome"),

  scrapeRankings: (chromeUrl: string): ReturnType<typeof scrapeRankings> =>
    ipcRenderer.invoke("scrape-rankings", chromeUrl),
  getContents: (
    chromeUrl: string,
    articleLinks: string[]
  ): ReturnType<typeof getArticleContents> =>
    ipcRenderer.invoke("get-contents", chromeUrl, articleLinks),

  validateChromeUrl: (url: string): Promise<boolean> =>
    ipcRenderer.invoke("validate-chrome-url", url),
  validateToken: (token: string): Promise<boolean> =>
    ipcRenderer.invoke("validate-token", token),
} as const;

contextBridge.exposeInMainWorld("api", api);

declare global {
  interface Window {
    api: typeof api;
  }
}
