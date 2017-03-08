const libraries = require('../libraries/index.json');

var fs = require('fs-extra'),
	{ join } = require('path');


require('colors');

function install(libraryNameWithVersion, { force, output}) {
	let [name, shortVersion] = libraryNameWithVersion.split('#'),
		fromPath = join(__dirname, '..', 'libraries', name, shortVersion),
		targetPath = join(output, name);

	if (fs.existsSync(targetPath) && !force) {
		console.error(`\n  error: target path is existed "${targetPath.italic}"\n    you can use option "-f" to overwrite it\n`);
		return false;
	}
	
	if (!fs.existsSync(targetPath)) {
		console.log(`  creating output folder "${targetPath.italic}" ...`.grey);
		fs.mkdirsSync(output);
		console.log('  created output folder!');
	}

	try {
		fs.copySync(fromPath, targetPath);
	} catch (e) {
		console.error(`\n  error: copy "${fromPath}" to "targetPath"\n${e.stack}\n`);
		return false;
	}

	console.log(`    install to "${targetPath}" success!`.green);

	return true;
}

/**
 * @param {String} _name 
 */
function match(_name) {
	var [name, version] = _name.split('#');

	var _match = name => Object.keys(libraries).filter(_ => _.startsWith(name));

	var matchResult = _match(name);
	if (matchResult.length > 1) {
		let _ = matchResult.filter(name => version && name.endsWith(`#${version}`));
		if (_.length == 1) return _[0];	

		console.error(`\n  error: ${name.bold} match more than one library!`);
		console.log(`\n    ${matchResult.join('\n    ')}\n`);
		return;
	}
	if (matchResult.length == 0) {
		console.error(`\n  error: ${name.bold} could match any library!`);
		while (name = name.slice(0, -1)) {
			let r = _match(name);
			if (r.length) {
				console.log(`\n    ${r.join('\n    ')}\n`);
				break;
			}
		}
		return;
	}

	return matchResult[0];
}

function printAll() {

	let lines = [];
	let maxLength = 0;
	let spaceStr = new Array(1024).join(' ');
	
	console.log(`\n\n  All libraries:\n`.bold);
	for (let nameVersion in libraries) {
		let [name, shortVersion] = nameVersion.split('#');
		lines.push({
			prefix: `      ${name.bold} #${shortVersion}        `,
			suffix: libraries[nameVersion].grey
		});
	}
	maxLength = lines.reduce((a, b) => Math.max(a, b.prefix.length), 0);
	lines.map(line => ({ prefix: line.prefix.concat(spaceStr.slice(0, maxLength - line.prefix.length)), suffix: line.suffix }))
		.forEach(line => console.log(line.prefix + line.suffix));

	console.log('\n');
	
}

module.exports = { printAll, match, install, libraries };
