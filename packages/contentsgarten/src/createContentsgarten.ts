import { MongoClient } from 'mongodb'
import { Contentsgarten } from './Contentsgarten'
import { GitHubFirebaseAuth } from './ContentsgartenAuth'
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
    pageFileExtension: config.pageFileExtension,
    pageFilePrefix: config.pageFilePrefix,
  })
  return contentsgarten
}
