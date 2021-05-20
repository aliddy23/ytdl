const path = require('path');

module.exports = {
	transpileDependencies: ['vuetify'],
	pluginOptions: {
		electronBuilder: {
			externals: ['chokidar'],
			outputDir: 'dist',
			removeElectronJunk: false,
			nodeIntegration: true,
			builderOptions: {
				productName: 'YouTube Downloader',
				appId: 'ga.theparadigm.www',
				mac: {
					darkModeSupport: true,
					target: 'dmg'
				},
				dmg: {
					artifactName: 'YouTube-Downloader-v${version}.${ext}',
					title: 'YouTube Downloader'
				},
				win: {
					target: 'nsis'
				},
				nsis: {
					artifactName: 'YouTube-Downloader-v${version}.${ext}',
					deleteAppDataOnUninstall: true,
					shortcutName: 'YouTube Downloader',
					uninstallDisplayName: 'YouTube Downloader'
				},
				linux: {
					target: 'deb'
				},
				deb: {
					artifactName: 'YouTube-Downloader-v${version}.${ext}'
				}
			}
		}
	}
};
