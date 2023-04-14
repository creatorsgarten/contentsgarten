import { MongoClient } from 'mongodb'
import { Contentsgarten } from './Contentsgarten'
import { GitHubFirebaseAuth } from './ContentsgartenAuth'
import { ContentsgartenDefaultCache } from './ContentsgartenCache'
import { GitHubStorage } from './ContentsgartenStorage'
import { GitHubTeamResolver } from './ContentsgartenTeamResolver'
import { ContentsgartenUserConfig } from './ContentsgartenUserConfig'
import { GitHubApp } from './GitHubApp'
import { MongoDBPageDatabase } from './ContentsgartenPageDatabase'

export function createContentsgarten(
  config: ContentsgartenUserConfig,
): Contentsgarten {
  const gitHubApp = new GitHubApp(config.github.auth)
  const mongo = new MongoClient(config.mongodb.uri)
  const db = config.mongodb.database
    ? mongo.db(config.mongodb.database)
    : mongo.db()
  const contentsgarten = new Contentsgarten({
    storage: new GitHubStorage({
      repo: config.github.repo,
      branch: config.github.branch,
      app: gitHubApp,
    }),
    pageDatabase: new MongoDBPageDatabase(db),
    auth: new GitHubFirebaseAuth({
      gitHub: {
        app: gitHubApp,
      },
      firebase: config.firebase,
    }),
    teamResolver: new GitHubTeamResolver(gitHubApp),
    cache: getCache(config.legacyCache?.url, config.legacyCache?.signingKey),
    pageFileExtension: config.pageFileExtension,
    pageFilePrefix: config.pageFilePrefix,
  })
  return contentsgarten
}

function getCache(url?: string, signingKey?: string) {
  const globalAny = global as any as {
    __contentsgarten_cache__: Map<string, any>
  }
  const map = (globalAny.__contentsgarten_cache__ ??= new Map())
  const mapKey = [url, signingKey].join(' ')
  const cache = map.get(mapKey)
  if (cache) return cache
  const newCache = new ContentsgartenDefaultCache({ url, signingKey })
  map.set(mapKey, newCache)
  return newCache
}
