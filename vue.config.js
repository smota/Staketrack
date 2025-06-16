const webpack = require('webpack')

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // Add Vue feature flags to avoid warnings
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(true)
      })
    ]
  }
}
