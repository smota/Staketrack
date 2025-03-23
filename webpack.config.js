const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables
const env = process.env.NODE_ENV === 'production'
  ? dotenv.config({ path: '.env.production' })
  : dotenv.config({ path: '.env.development' });

module.exports = {
  entry: './js/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true // Clean the dist folder before each build
  },
  // Add support for development mode
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  // Basic rules for JavaScript files
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  },
  // Resolve aliases to fix file path issues
  resolve: {
    alias: {
      '@firebase': path.resolve(__dirname, 'firebase')
    },
    modules: [path.resolve(__dirname), 'node_modules'],
    fallback: {
      "process": require.resolve("process/browser")
    }
  },
  // Add plugins
  plugins: [
    // Define environment variables - only for process.env, not window.ENV
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    }),
    // Provide process/browser for the bundle
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'blocking' // Make sure scripts load in a blocking manner
    }),
    new CopyPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'images', to: 'images', noErrorOnMissing: true },
        { from: 'firebase', to: 'firebase' }
      ]
    })
  ]
}; 