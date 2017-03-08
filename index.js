function main(args) {

	var packageInfo = require('./package.json'),
		manager = require('./src/manager'),
		app = require('commander');
	app._name = Object.keys(packageInfo.bin)[0];
	app
		.usage('[options] <library-name-version> [options]')
		.version(packageInfo.version)
		.option('-f, --force', 'overwrite existed folder')
		.option('-o, --output <install-path>', 'path where install to, the default value in current path',
		process.cwd());
	
	app.command('list')
		.description('list all libraries')	
		.action(() => manager.printAll() + process.exit(0));
	
	app.parse(args);

	console.log();	
	app.force && console.log(`  ${'-f'.bold.yellow} ${'overwrite mode be turn on!'.yellow}`);
	
	var searchLibraries = app.args,
		libraryName;
	searchLibraries.forEach(searchLib => {
		if (!(libraryName = manager.match(searchLib)) )
			process.exit(1);
		console.log(`\n  library: ${libraryName.bold}    ${manager.libraries[libraryName].grey}`);
		if (!manager.install(libraryName, app))
			process.exit(1);	
	});

	console.log(`\n  done.\n`);
};

module.exports = main;