/** @type {import('extension').FileConfig} */

module.exports = {
  output: {
    publicPath: 'chrome-extension://egknoknehanlgkjlhphfgfgbpjinmjie/',
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        type: 'asset/resource' // Emits CSS as a separate file and gives you the URL
      }
    ]
  }
}