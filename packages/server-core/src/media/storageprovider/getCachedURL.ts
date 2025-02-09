import config from '../../appconfig'

/**
 * Constructs the full URL for a cached asset
 * @param path the full key/path for the storage provider
 * @param cacheDomain the cache domain of the storage provider
 * @returns {string}
 */
export const getCachedURL = (path: string, cacheDomain: string) => {
  if (!cacheDomain) throw new Error('No cache domain found - please check the storage provider configuration')

  if (config.server.storageProvider === 's3' && config.aws.s3.s3DevMode === 'local') {
    return `http://${cacheDomain}/${path}`
  }

  return new URL(path ?? '', 'https://' + cacheDomain).href
}
