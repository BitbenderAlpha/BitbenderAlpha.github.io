module.exports = {
	...require('./webpack.config'),
	mode: 'development',
	devServer: { static: './docs' },
}