#!/usr/bin/env node
'use strict';

// подключаем необходимые модули
const { version, name } = require('./package.json');
const crypto = require('crypto'); // модуль с криптографическими примитивами
const path = require('path'); // модуль для работы с путями файловой системы
const fs = require('fs'); // модель для работы с файловой системой
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const dive = require('dive'); // модуль для рекурсивного поиска по директориям

const config = require('./commands-config');

let options;
try {
	// парсим аргументы командной строки с помощью специального модуля `command-line-args`
	options = commandLineArgs(config.definitions, process.argv);
} catch (err) {
	console.error('Invalid usage! Use --help for help');
	throw err;
}

// проверяем наличие параметра --help или -h в аргументах командной строки
if (options.help) {
	// выводим инструкцию по использованию модуля
	const usage = commandLineUsage(config.usage);

	console.log(usage);
	process.exit(0);
}

// если передан ключ --version или -v, выводим версию программы
if (options.version) {
	console.log(`Version of ${name} is ${version}`);
	process.exit(0);
}

// если не переданы необходимые параметры, выводим сообщение об ошибке
if (typeof options.path !== 'string' || typeof options.repeat !== 'number' || !['zero', 'random'].includes(options.kind)) {
	console.error('Invalid usage! Use --help for help');
	process.exit(1);
}

// Нормализуем переданный путь и получаем метаинформацию об объекте
const pathname = path.resolve(options.path);
const stats = fs.statSync(pathname);

const files = [];

/**
 * Функция для безопасного удаления файла
 * @param {string} filename - путь к файлу
 */
function removeFile(filename) {
	// получаем информацию о файле (в частности его размер в байтах)
	const fileStats = fs.statSync(filename);
	for (let i = 0; i < options.repeat; i++) {
		// создаём буффер необходимого размера
		let buffer = Buffer.alloc(fileStats.size);
		if (options.kind === 'random') {
			// заполнение буфера случайными значениями
			crypto.randomFillSync(buffer);
		}

		// записываем содержимое буфера в этот файл
		fs.writeFileSync(filename, buffer);
		// сбрасываем буферизованные данные на диск
		process.stdout.write('');

		// очищаем память
		buffer = null;
	}

	// удаление записи о файле из файловой системы
	fs.unlinkSync(filename);
}

/**
 * Функция, которая безопасно удаляет каждый файл из переданного набора файлов
 * @param {string[]} files - список файлов
 */
function safeRemove(files) {
	files.map(removeFile);
}

/**
 * Функция безопасного рекурсивного удаления всех файлов в папке
 * @param {string} path - путь к удаляемой папке
 */
function removeFolderRecursive(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function (file, index) {
			const curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				removeFolderRecursive(curPath);
			} else {
				safeRemove([file])
			}
		});
		fs.rmdirSync(path);
	}
}

if (!stats.isDirectory()) {
	// если был передан путь к файлу - то удаляем только его
	files.push(pathname);
	safeRemove(files);
} else {
	// иначе рекурсивно обходим директорию, получаем список всех файлов в ней, а затем все их удаляем
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
		// удаляем сначала файлы
		safeRemove(files);
		// а потом и саму директорию с поддиректориями
		removeFolderRecursive(pathname);
	});
}
