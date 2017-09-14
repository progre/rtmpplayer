const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const uglifySaveLicense = require('uglify-save-license');

const isProduction = process.env.NODE_ENV === 'production';

const common = {
  devtool: isProduction ? false : 'inline-source-map',
  node: { __dirname: true, __filename: true },
  resolve: { extensions: ['.ts', '.tsx', '.js'] },
  watchOptions: { ignored: /node_modules|lib/ },
};

const tsLoader = {
  rules: [{
    test: /\.tsx?$/,
    use: [
      {
        loader: 'ts-loader',
        options: { compilerOptions: { sourceMap: !isProduction } }
      }
    ]
  }]
};

const clientSide = {
  entry: {
    index: './src/public/js/index.ts'
  },
  module: tsLoader,
  output: { filename: 'lib/public/js/[name].js' },
  plugins: [
    new CopyWebpackPlugin(
      [{ from: 'src/public/', to: 'lib/public/' }],
      { ignore: ['test/', '*.ts', '*.tsx'] },
    ),
    ...(
      !isProduction ? [] : [
        new webpack.optimize.UglifyJsPlugin({
          output: { comments: uglifySaveLicense }
        })
      ]
    )
  ],
  target: 'web',
};

const serverSide = {
  entry: {
    index: './src/index.ts'
  },
  externals: /^(?!\.)/,
  module: tsLoader,
  output: { filename: 'lib/[name].js', libraryTarget: 'commonjs2' },
  target: 'node',
};

module.exports = [
  Object.assign({}, common, clientSide),
  Object.assign({}, common, serverSide),
];
