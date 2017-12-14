#!/usr/bin/env node
'use strict';

const { version, name } = require('./package.json');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const dive = require('dive');

const config = require('./commands-config');

let options;
try {
	options = commandLineArgs(config.definitions, process.argv);
} catch (err) {
	console.log('Invalid usage! Use --help for help');
	throw err;
}

if (options.help) {
	const usage = commandLineUsage(config.usage);

	console.log(usage);
	process.exit(0);
}

if (options.version) {
	console.log(`Version of ${name} is ${version}`);
	process.exit(0);
}

if (typeof options.path !== 'string' || typeof options.repeat !== 'number' || !['zero', 'random'].includes(options.kind)) {
	console.log('Invalid usage! Use --help for help');
	process.exit(1);
}

const pathname = path.resolve(options.path);
const stats = fs.statSync(pathname);

const files = [];

function removeFile(filename) {
	const fileStats = fs.statSync(filename);
	for (let i = 0; i < options.repeat; i++) {
		let buffer = Buffer.alloc(fileStats.size);
		if (options.kind === 'random') {
			// заполнение буфера случайными значениями
			crypto.randomFillSync(buffer);
		}

		fs.writeFileSync(filename, buffer);
		// сбрасываем буферизованные данные на диск
		process.stdout.write('');

		buffer = null;
	}

	fs.unlinkSync(filename);
}

function safeRemove(files) {
	files.map(removeFile);
}

if (!stats.isDirectory()) {
	files.push(pathname);
	safeRemove(files);
} else {
	dive(pathname, {
		recursive: true,
		all: true,
		directories: false,
		files: true,
	}, function (err, file, stat) {
		if (err) {
			console.error(err);
			process.exit(1);
		}
		files.push(file);
	}, function () {
		safeRemove(files);
		fs.unlinkSync(pathname);
	});
}
