const path = require('path');

module.exports = {
	devServer: {
		https: false,
		proxy: {
			'^/api': {
				target: 'https://mercury.theparadigm.ga',
				changeOrigin: true,
				ws: true,
				cookieDomainRewrite: {
					'*': ''
				}
			}
		}
	},
	transpileDependencies: ['vuetify'],
	pluginOptions: {
		electronBuilder: {
			externals: ['chokidar'],
			outputDir: 'dist',
			removeElectronJunk: false,
			nodeIntegration: true,
			builderOptions: {
				productName: 'Mercury',
				appId: 'ga.theparadigm.mercury',
				mac: {
					darkModeSupport: true,
					target: 'dmg'
				},
				dmg: {
					artifactName: 'Mercury-v${version}.${ext}',
					title: 'Mercury'
				},
				win: {
					target: 'nsis'
				},
				nsis: {
					artifactName: 'Mercury-v${version}.${ext}',
					deleteAppDataOnUninstall: true,
					shortcutName: 'Mercury',
					uninstallDisplayName: 'Mercury'
				},
				linux: {
					target: 'deb'
				},
				deb: {
					artifactName: 'Mercury-v${version}.${ext}'
				}
			}
		}
	}
};
