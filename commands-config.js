'use strict';

const {version, name} = require('./package.json');

const definitions = [
	{
		name: 'version',
		alias: 'v',
		type: Boolean,
		description: 'Выводит версию утилиты',
	},
	{
		name: 'help',
		alias: 'h',
		type: Boolean,
		description: 'Выводит это руководство',
	},
	{
		name: 'path',
		alias: 'p',
		type: String,
		description: 'Путь до удаляемой директории или файла',
	},
	{
		name: 'repeat',
		alias: 'r',
		type: Number,
		description: 'Количество перезатираний файлов',
	},
	{
		name: 'kind',
		type: String,
		typeLabel: '[underline]{(zero|random)}',
		description: 'Способ затирания файлов (zero или random)',
	},
];

module.exports = {
	definitions,
	usage: [
		{
			header: name,
			content: 'Консольная утилита безопасного удаления файлов',
		},
		{
			header: 'Synopsis',
			content: [
				'$ npm start -- <options>',
				'$ npm start -- [bold]{--version}',
				'$ npm start -- [bold]{--help}',
				'$ npm start -- [bold]{--path}=path-to-file [bold]{--repeat}=16 [bold]{--kind}=zero',
			],
		},
		{
			header: 'Options',
			optionList: definitions,
		},
		{
			content: '[italic]{Version ' + version + '}',
		},
	],
};
