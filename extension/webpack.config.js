const path = require('path');
const autoprefixer = require('autoprefixer');
const { EnvironmentPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const miniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  mode: 'development',
  entry: {
    'popup': {
      'import': './popup/src/js/popup.js',
    },
    'extension': {
      'import': './src/js/extension.js',
    },
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new EnvironmentPlugin({
      APP_NAME: 'reecon',
      BASE_URL: 'http://127.0.0.1:8888',
      // BASE_URL: 'https://reecon.xyz',

      // TODO: These values should be returned from the backend server if they should match server settings
      CACHE_REDDITOR_FRESHNESS_MINUTES: 43800, // 1 month. Equal to REDDITOR_FRESHNESS_TD in backend server.
      CACHE_THREAD_FRESHNESS_MINUTES: 15, // Equal to THREAD_FRESHNESS_TD in backend server.
    }),
    new HtmlWebpackPlugin({ template: './popup/src/index.html' }),
    new miniCssExtractPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: [
          {
            // Extracts CSS for each JS file that includes CSS
            loader: miniCssExtractPlugin.loader
          },
          {
            // Interprets `@import` and `url()` like `import/require()` and will resolve them
            loader: 'css-loader'
          },
          {
            // Loader for webpack to process CSS with PostCSS
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  autoprefixer
                ]
              }
            }
          },
          {
            // Loads a SASS/SCSS file and compiles it to CSS
            loader: 'sass-loader'
          }
        ]
      }
    ]
  }
};
