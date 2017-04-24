const DEFINE_FOLDER = `${__dirname}/../libraries_def/`,
	TARGET_FOLDER = `${__dirname}/../libraries/`,
	INDEX_FILE = `${TARGET_FOLDER}/index.json`;

const fs = require('fs-extra');
const { dirname } = require('path');
const request = require('request');
require('colors');

(function main() {
	printStart();

	let downloadList = [],
		totalFileCount = 0,
		lastDownloadName = '',
		index = {},
		startTime = Date.now(),
		retryTimes = 0;
	
	try { 
		index = require(INDEX_FILE);
		console.log('Included existed index file!'.green);
	} catch (e) {}

	downloadList = genDownloadListFromDefinitionInfo(index);
	totalFileCount = downloadList.length;
	
	download();

	function download(isRetry = false) {
		if (!isRetry) retryTimes = 0;
		if (isRetry)
			if (retryTimes++ >= 5)
				return printErrorEnd(downloadList[0].name);

		if (!downloadList.length) return finish();
		
		var { url, target, fileName, id, name, shortVersion, version } = downloadList[0];
		
		name != lastDownloadName &&
			console.log(`\n${lastDownloadName = name} ${'------'.cyan}`);
		
		fs.mkdirsSync(dirname(target));
		console.log(`[${id + 1}/${totalFileCount}] ${isRetry ? 'Retrying' : 'Downloading'} ${fileName} ...`);
		let pipeline = request(url, { method: 'GET', });
		let metError = false;
		pipeline.on('response', response => {
				if (response.statusCode != 200) {
					console.error(`[${id + 1}/${totalFileCount}] Download error: ${fileName} status code: `.red +
						String(response.statusCode).red.bold);
					process.nextTick(() => download(true));
					metError = true;
				}
			}).on('error', err => {
				metError = true;
				console.error(`[${id + 1}/${totalFileCount}] Download error: ${fileName}\n${err.stack}`.red);
				process.nextTick(() => download(true));
			}).on('complete', () => {
				if (metError) return;
				console.log(`[${id + 1}/${totalFileCount}] Download success!`.green);
				downloadList.shift();
				index[getIndexName(name, shortVersion)] = version;
				process.nextTick(() => download());
			}).pipe(fs.createWriteStream(target));
	}

	function finish() {
		fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, '\t'));
		printEnd(((Date.now() - startTime) / 1000).toFixed(0).green);
	}
})();

function getIndexName(name, shortVersion) { return `${name}#${shortVersion}`; }

function genDownloadListFromDefinitionInfo(index = {}) {
	var downloadList = [];
	fs.readdirSync(DEFINE_FOLDER)
		.filter(fileName => fileName.endsWith('.json'))
		.forEach(fileName => {
			var object = require(DEFINE_FOLDER + fileName),
				hostname = object._cdn;
			for (var name in object) {
				if (name == '_cdn') continue;
				let def = object[name];
				for (var shortVersion in def) {
					let { baseUri, version, files } = def[shortVersion];
					let nameAndVersion = `${name} ${version}`;
					if (index[getIndexName(name, shortVersion)] == version) {
						console.log(`Ignored existed library "${nameAndVersion}"!`.cyan);
						continue;
					}
					files.forEach(file => downloadList.push({
						fileName: file,
						url: hostname + baseUri.replace('${version}', version) + file,
						target: `${TARGET_FOLDER}${name}/${shortVersion}/${file}`,
						name, version,
						shortVersion: shortVersion,
						id: downloadList.length
					}));
				}
			}
		});
	return downloadList;
}

function printStart() {
	console.log('========================================================');
	console.log(` Start install Frontend library`.cyan);
	console.log('========================================================');
}
function printEnd(cost) {
	console.log('========================================================');
	console.log(` ${'Install Frontend library success!'.green}     cost: ${cost}s `);
	console.log('========================================================');
}
function printErrorEnd(failedName) {
	console.log('========================================================');
	console.log(` ${'Install Frontend library failed!'.red}`);
	console.log(`   try to download `.red + failedName.red.bold + ` more than 5 times!`.red);
	console.log('========================================================');
}