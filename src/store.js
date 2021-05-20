import electron from 'electron';
import path from 'path';
import fs from 'fs';

const defaults = {
	bounds: { width: 550, height: 600 }
};

class Store {
	constructor() {
		const userDataPath = (electron.app || electron.remote.app).getPath('userData');
		this.path = path.join(userDataPath, 'settings.json');

		this.data = parseDataFile(this.path);
	}

	get(key) {
		return this.data[key];
	}

	set(key, val) {
		this.data[key] = val;
		fs.writeFileSync(this.path, JSON.stringify(this.data));
	}
}

function parseDataFile(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath));
	} catch (error) {
		return defaults;
	}
}

export default Store;
