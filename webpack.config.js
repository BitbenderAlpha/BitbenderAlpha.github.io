const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
	mode: 'production',
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.ts', '.js' ],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'docs'),
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, 'static', 'index.html'),
			favicon: path.resolve(__dirname, 'static', 'favicon.ico'),
		}),
	],
};