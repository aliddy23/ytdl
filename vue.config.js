const path = require("path");

module.exports = {
	transpileDependencies: ["vuetify"],
	pluginOptions: {
		electronBuilder: {
			externals: ["chokidar", "ffmpeg-static"],
			outputDir: "dist",
			removeElectronJunk: false,
			nodeIntegration: true,
			builderOptions: {
				asarUnpack: [
					"node_modules/ffmpeg-static/bin/${os}/${arch}/ffmpeg",
					"node_modules/ffmpeg-static/index.js",
					"node_modules/ffmpeg-static/package.json",
					"node_modules/ffmpeg-static/ffmpeg.exe",
				],
				productName: "YouTube Downloader",
				appId: "com.aidanliddy.ytdl",
				mac: {
					darkModeSupport: true,
					target: "dmg",
				},
				dmg: {
					artifactName: "YouTube-Downloader-v${version}.${ext}",
					title: "YouTube Downloader",
				},
				win: {
					target: "nsis",
				},
				nsis: {
					artifactName: "YouTube-Downloader-v${version}.${ext}",
					deleteAppDataOnUninstall: true,
					shortcutName: "YouTube Downloader",
					uninstallDisplayName: "YouTube Downloader",
				},
				linux: {
					target: "deb",
				},
				deb: {
					artifactName: "YouTube-Downloader-v${version}.${ext}",
				},
			},
		},
	},
};
