import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { getArticleContents, scrapeRankings } from "./scrape";
import puppeteer, { Browser, ElementHandle, Page } from "puppeteer-core";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.handle("scrape-rankings", async (event, chromeUrl: string) => {
  const rankings = await scrapeRankings(chromeUrl);

  if (!rankings) return;

  return rankings;
});
ipcMain.handle(
  "get-contents",
  async (event, chromeUrl: string, articleLinks: string[]) => {
    const contents = await getArticleContents(chromeUrl, articleLinks);

    return contents;
  }
);

const getPath = async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({});
  if (!canceled) {
    return filePaths[0];
  }
};

ipcMain.handle("dialog:chrome", async () => {
  const chromeUrl = await getPath();

  if (process.platform === "darwin") {
    return chromeUrl?.split("/").at(-1) === "Google Chrome.app"
      ? chromeUrl
          .split("/")
          .filter((s) => s !== "Google Chrome.app")
          .join("/") + "/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined;
  }

  return chromeUrl;
});

ipcMain.handle("validate-chrome-url", async (event, url): Promise<boolean> => {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      executablePath: url, // macos
      headless: true,
    });

    browser.close();
    return true;
  } catch {
    browser?.close();
    return false;
  }
});

ipcMain.handle(
  "validate-token",
  async (event, token: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${token}`,
        {
          method: "POST",
          body: '{"contents":[{"parts":[{"text":"what is 1+1? Answer must be short. No other text, just number! MUST"}]}]}',
        }
      );

      return res.status === 200 ? true : false;
    } catch (e) {
      return false;
    }
  }
);
