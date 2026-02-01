const path = require("path");

module.exports = {
  entry: {
    gantt: "./src/index.tsx",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: false, // Don't clean so we keep our HTML files
    publicPath: "",
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
      {
        test: /\.html$/,
        type: "asset/resource",
      },
    ],
  },
  externals: {
    // Azure DevOps SDK is provided by the host
    "azure-devops-extension-sdk": "SDK",
    "react": "React",
    "react-dom": "ReactDOM",
  },
  devtool: "source-map",
  performance: {
    hints: false,
  },
};
