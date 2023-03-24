/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ...(process.env.NETLIFY
    ? {
        serverBuildTarget: 'netlify',
        server: './server.js',
      }
    : {}),
  ignoredRouteFiles: ['**/.*'],
  // https://remix.run/docs/en/v1/pages/gotchas#importing-esm-packages
  serverDependenciesToBundle: [
    'lodash-es',
    'contentsgarten',
    'p-memoize',
    'mimic-fn',
    '@contentsgarten/markdown',
  ],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  watchPaths: [
    '../packages/contentsgarten-cjs/dist/index.js',
    '../packages/markdown/dist/index.js',
  ],
}
