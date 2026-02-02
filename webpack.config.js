const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";

  return {
    entry: {
      gantt: "./src/index.tsx",
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
      clean: false, // Don't clean so we keep our HTML files
      // For dev server, serve from /dist/ path to match extension expectations
      publicPath: isDev ? "/dist/" : "",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".css"],
      alias: {
        "@services": path.resolve(__dirname, "src/services"),
        "@types": path.resolve(__dirname, "src/types"),
        "@components": path.resolve(__dirname, "src/components"),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: "asset/resource",
        },
      ],
    },
    externals: {
      // React libraries loaded via CDN to reduce bundle size
      react: "React",
      "react-dom": "ReactDOM",
    },
    // Use inline-source-map for dev (better debugging), source-map for prod
    devtool: isDev ? "inline-source-map" : "source-map",
    performance: {
      hints: false,
    },
    // Dev server configuration for hot reload
    devServer: {
      server: "https", // HTTPS required for Azure DevOps
      port: 3000,
      hot: true,
      // Serve static files (HTML, images) from these directories
      static: [
        {
          directory: path.join(__dirname, "dist"),
          publicPath: "/dist",
        },
        {
          directory: path.join(__dirname, "static"),
          publicPath: "/static",
        },
      ],
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      client: {
        overlay: true,
      },
    },
    plugins: isDev
      ? [
          // Copy HTML files to dist during dev
          new CopyWebpackPlugin({
            patterns: [{ from: "dist/*.html", to: "[name][ext]" }],
          }),
        ]
      : [],
  };
};
