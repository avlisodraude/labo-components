var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'dist');
var APP_DIR = path.resolve(__dirname, 'app');

var config = {
	entry: [APP_DIR + '/index.jsx'],

	devtool: 'source-map',

	output: {
		path: BUILD_DIR,
		publicPath: '/static/dist/',
		filename: 'labo-components.js',
		library: 'labo',
		libraryTarget: 'umd'
	},

	plugins : [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': JSON.stringify('production')
			}
		})
	],

	resolve: { extensions: ['', '.js', '.jsx'] },

	module : {
		loaders : [
			{
				test : /\.jsx?/,
				include : APP_DIR,
				loader : 'babel',
				exclude: /node_modules/
			}
		]
	},

	externals: {
        "jquery": "jQuery",
        "react": "React",
        "react-dom": "ReactDOM"
    }
};

module.exports = config;