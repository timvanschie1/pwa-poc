const path = require('path');
const TerserJSPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const entryConfig = {
    mode: 'development',
    devtool: 'source-map',
    context: path.resolve(__dirname, 'src'),
    entry: {
        entry: './entry.js',
    },

    output: {
        path: path.resolve(__dirname, './dist/'),
        publicPath: "/dist/",
        filename: './[name].js',
    },

    optimization: {
        minimizer: [
            new TerserJSPlugin({}),
            new OptimizeCSSAssetsPlugin({})
        ]
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.resolve(__dirname, 'src'),
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                "@babel/preset-env",
                                "@babel/preset-react"
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.(png|jpg|jpeg|svg)$/,
                use: [{
                    loader: 'file-loader?name=[path][name].[ext]'
                }]
            },
            {
                test: /\.(eot|otf|ttf|woff|woff2)$/,
                use: [{
                    loader: 'file-loader?name=fonts/[name].[ext]'
                }]
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    'style-loader',
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            url: false
                        }
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            },
        ]
    },

    plugins: [
        new WriteFilePlugin(),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "./[name].css",
            chunkFilename: "[id].css"
        }),
        new CopyWebpackPlugin([
            {
                from: './assets/*',
                to: './assets/',
                flatten: true
            },
            {
                from: 'index.html',
                to: './'
            },
            {
                from: 'service-worker.js',
                to: './'
            },
        ]),
    ],
};

module.exports = [entryConfig];