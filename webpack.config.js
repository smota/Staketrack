const path = require('path');

module.exports = {
  entry: './js/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
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
  }
}; 