"use strict";

import { app, protocol, BrowserWindow, Menu, MenuItem, shell } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import { autoUpdater } from "electron-updater";
import path from "path";
const isDevelopment = process.env.NODE_ENV !== "production";

let win;

protocol.registerSchemesAsPrivileged([
	{ scheme: "app", privileges: { secure: true, standard: true } },
]);

if (process.defaultApp) {
	if (process.argv.length >= 2) {
		app.setAsDefaultProtocolClient("ytdl", process.execPath, [
			path.resolve(process.argv[1]),
		]);
	}
} else {
	app.setAsDefaultProtocolClient("ytdl");
}

async function createWindow() {
	win = new BrowserWindow({
		width: 560,
		height: 600,
		titleBarStyle: "hiddenInset",
		titleBarOverlay: true,
		resizable: false,
		title: "YouTube Downloader",
		frame: false,
		webPreferences: {
			enableRemoteModule: true,
			nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			contextIsolation: false,
		},
	});
	if (process.platform == "darwin") win.setWindowButtonVisibility(true);

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
		if (!process.env.IS_TEST) win.webContents.openDevTools();
	} else {
		createProtocol("app");
		win.loadURL("app://./index.html");
	}
}

app.whenReady().then(() => {
	const gotTheLock = app.requestSingleInstanceLock();

	if (!gotTheLock) {
		app.quit();
	} else {
		app.on("second-instance", (event, commandLine, workingDirectory) => {
			if (win) {
				if (win.isMinimized()) win.restore();
				win.focus();
			}
		});

		app.on("open-url", (event, url) => {
			if (BrowserWindow.getAllWindows().length === 0) createWindow();
			setTimeout(() => {
				win.webContents.send("url", url);
			}, 1000);
		});
	}

	app.on("open-url", (event, url) => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
		setTimeout(() => {
			win.webContents.send("url", url);
		}, 1000);
	});

	autoUpdater.checkForUpdatesAndNotify();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		try {
			await installExtension(VUEJS_DEVTOOLS);
		} catch (e) {
			console.error("Vue Devtools failed to install:", e.toString());
		}
	}
	createWindow();
});

if (isDevelopment) {
	if (process.platform === "win32") {
		process.on("message", (data) => {
			if (data === "graceful-exit") {
				app.quit();
			}
		});
	} else {
		process.on("SIGTERM", () => {
			app.quit();
		});
	}
}

const isMac = process.platform === "darwin";

const menu = new Menu();
menu.append(
	new MenuItem({
		label: "YouTube Downloader",
		submenu: [
			{
				label: "About YouTube Downloader",
				role: "about",
			},
			{ role: "reload" },
			{ role: "toggleDevTools" },
			{ type: "separator" },
			{ role: "services" },
			{ type: "separator" },
			{ role: "hide", label: "Hide YouTube Downloader" },
			{ role: "hideOthers" },
			{ role: "unhide" },
			{ type: "separator" },
			{
				label: "Quit YouTube Downloader",
				role: "quit",
			},
		],
	})
);

menu.append(
	new MenuItem({
		label: "File",
		submenu: [
			{
				label: "Get Browser Extensions",
				click: async () => {
					await shell.openExternal(
						"https://www.aidanliddy.com/ytdl#extensions"
					);
				},
			},
			isMac ? { role: "close" } : { role: "quit" },
		],
	})
);

menu.append(
	new MenuItem({
		label: "Edit",
		submenu: [{ role: "cut" }, { role: "copy" }, { role: "paste" }],
	})
);

Menu.setApplicationMenu(menu);
