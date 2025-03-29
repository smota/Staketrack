const webpack = require('webpack')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  configureWebpack: {
    plugins: [
      // Define environment variables with APP_ prefix
      new webpack.DefinePlugin({
        // Process all environment variables that start with APP_
        ...Object.keys(process.env)
          .filter(key => key.startsWith('APP_'))
          .reduce((env, key) => {
            env[`process.env.${key}`] = JSON.stringify(process.env[key])
            return env
          }, {})
      })
    ]
  }
}
