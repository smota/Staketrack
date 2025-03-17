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
    modules: [path.resolve(__dirname), 'node_modules']
  },
  // Add plugins
  plugins: [
    // Define environment variables
    new webpack.DefinePlugin({
      'window.ENV': JSON.stringify({
        ENVIRONMENT: process.env.ENVIRONMENT || 'DEV',
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
        FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
        USE_EMULATORS: process.env.USE_EMULATORS || 'false'
      })
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