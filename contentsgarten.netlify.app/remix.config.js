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
    'p-memoize',
    'mimic-fn',
    '@contentsgarten/html',
    '@contentsgarten/server-utils',
  ],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  watchPaths: [
    '../packages/contentsgarten/dist/index.js',
    '../packages/markdown/dist/index.js',
  ],
  future: {
    unstable_tailwind: true,
  },
}
