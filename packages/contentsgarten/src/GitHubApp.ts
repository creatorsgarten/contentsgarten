import { createPrivateKey } from 'crypto'

export class GitHubApp {
  constructor(public config: GitHubAppConfig) {
    if (/BEGIN RSA PRIVATE KEY/.test(config.privateKey)) {
      const pkcs8 = createPrivateKey(config.privateKey).export({
        type: 'pkcs8',
        format: 'pem',
      })
      this.config = { ...config, privateKey: String(pkcs8) }
    }
  }
}

export interface GitHubAppConfig {
  appId: number
  privateKey: string
}
