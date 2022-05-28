module.exports = {
	globDirectory: '.',
	globPatterns: [
		'**/*.{png,xml,ico,json,css,html,js,config}'
	],
	swDest: 'sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};