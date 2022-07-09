/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: 'netlify',
  server: './server.js',
  ignoredRouteFiles: ['**/.*'],
  // https://remix.run/docs/en/v1/pages/gotchas#importing-esm-packages
  serverDependenciesToBundle: ['lodash-es', 'p-memoize', 'mimic-fn'],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
}
