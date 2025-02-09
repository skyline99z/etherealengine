import dotenv from 'dotenv'
import knex from 'knex'
import { DataTypes, Sequelize } from 'sequelize'

import { AwsSettingDatabaseType, awsSettingPath } from '@etherealengine/engine/src/schemas/setting/aws-setting.schema'
import {
  chargebeeSettingPath,
  ChargebeeSettingType
} from '@etherealengine/engine/src/schemas/setting/chargebee-setting.schema'
import { coilSettingPath, CoilSettingType } from '@etherealengine/engine/src/schemas/setting/coil-setting.schema'
import {
  EmailSettingDatabaseType,
  emailSettingPath
} from '@etherealengine/engine/src/schemas/setting/email-setting.schema'
import { redisSettingPath, RedisSettingType } from '@etherealengine/engine/src/schemas/setting/redis-setting.schema'
import {
  ServerSettingDatabaseType,
  serverSettingPath
} from '@etherealengine/engine/src/schemas/setting/server-setting.schema'
import {
  taskServerSettingPath,
  TaskServerSettingType
} from '@etherealengine/engine/src/schemas/setting/task-server-setting.schema'

import appConfig from './appconfig'
import logger from './ServerLogger'
import { awsDbToSchema } from './setting/aws-setting/aws-setting.resolvers'
import { emailDbToSchema } from './setting/email-setting/email-setting.resolvers'
import { serverDbToSchema } from './setting/server-setting/server-setting.resolvers'

dotenv.config()
const db = {
  username: process.env.MYSQL_USER ?? 'server',
  password: process.env.MYSQL_PASSWORD ?? 'password',
  database: process.env.MYSQL_DATABASE ?? 'etherealengine',
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: process.env.MYSQL_PORT ?? 3306,
  dialect: 'mysql',
  url: ''
}
const nonFeathersStrategies = ['emailMagicLink', 'smsMagicLink']

db.url = process.env.MYSQL_URL ?? `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`

export const updateAppConfig = async (): Promise<void> => {
  if (appConfig.db.forceRefresh || !appConfig.kubernetes.enabled) return

  const knexClient = knex({
    client: 'mysql',
    connection: {
      user: db.username,
      password: db.password,
      host: db.host,
      port: parseInt(db.port.toString()),
      database: db.database,
      charset: 'utf8mb4'
    }
  })
  const sequelizeClient = new Sequelize({
    ...(db as any),
    define: {
      freezeTableName: true
    },
    logging: false
  }) as any
  await sequelizeClient.sync()

  const promises: any[] = []

  const taskServerSettingPromise = knexClient
    .select()
    .from<TaskServerSettingType>(taskServerSettingPath)
    .then(([dbTaskServer]) => {
      if (dbTaskServer) {
        appConfig.taskserver = {
          ...appConfig.taskserver,
          ...dbTaskServer
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read taskServerSetting: ${e.message}`)
    })
  promises.push(taskServerSettingPromise)

  const authenticationSetting = sequelizeClient.define('authentication', {
    service: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authStrategies: {
      type: DataTypes.JSON,
      allowNull: true
    },
    jwtOptions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    bearerToken: {
      type: DataTypes.JSON,
      allowNull: true
    },
    callback: {
      type: DataTypes.JSON,
      allowNull: true
    },
    oauth: {
      type: DataTypes.JSON,
      allowNull: true
    }
  })
  const authenticationSettingPromise = authenticationSetting
    .findAll()
    .then(([dbAuthentication]) => {
      let oauth = JSON.parse(dbAuthentication.oauth)
      let authStrategies = JSON.parse(dbAuthentication.authStrategies)
      let jwtOptions = JSON.parse(dbAuthentication.jwtOptions)
      let bearerToken = JSON.parse(dbAuthentication.bearerToken)
      let callback = JSON.parse(dbAuthentication.callback)

      if (typeof oauth === 'string') oauth = JSON.parse(oauth)
      if (typeof authStrategies === 'string') authStrategies = JSON.parse(authStrategies)
      if (typeof jwtOptions === 'string') jwtOptions = JSON.parse(jwtOptions)
      if (typeof bearerToken === 'string') bearerToken = JSON.parse(bearerToken)
      if (typeof callback === 'string') callback = JSON.parse(callback)

      const dbAuthenticationConfig = dbAuthentication && {
        service: dbAuthentication.service,
        entity: dbAuthentication.entity,
        secret: dbAuthentication.secret,
        authStrategies: authStrategies,
        jwtOptions: jwtOptions,
        bearerToken: bearerToken,
        callback: callback,
        oauth: {
          ...oauth
        }
      }
      if (dbAuthenticationConfig) {
        if (oauth.defaults) dbAuthenticationConfig.oauth.defaults = JSON.parse(oauth.defaults)
        if (oauth.discord) dbAuthenticationConfig.oauth.discord = JSON.parse(oauth.discord)
        if (oauth.facebook) dbAuthenticationConfig.oauth.facebook = JSON.parse(oauth.facebook)
        if (oauth.github) dbAuthenticationConfig.oauth.github = JSON.parse(oauth.github)
        if (oauth.google) dbAuthenticationConfig.oauth.google = JSON.parse(oauth.google)
        if (oauth.linkedin) dbAuthenticationConfig.oauth.linkedin = JSON.parse(oauth.linkedin)
        if (oauth.twitter) dbAuthenticationConfig.oauth.twitter = JSON.parse(oauth.twitter)
        const authStrategies = ['jwt']
        for (let authStrategy of dbAuthenticationConfig.authStrategies) {
          const keys = Object.keys(authStrategy)
          for (let key of keys)
            if (nonFeathersStrategies.indexOf(key) < 0 && authStrategies.indexOf(key) < 0) authStrategies.push(key)
        }
        dbAuthenticationConfig.authStrategies = authStrategies
        appConfig.authentication = {
          ...appConfig.authentication,
          ...dbAuthenticationConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read authenticationSetting: ${e.message}`)
    })
  promises.push(authenticationSettingPromise)

  const awsSettingPromise = knexClient
    .select()
    .from<AwsSettingDatabaseType>(awsSettingPath)
    .then(([dbAws]) => {
      const dbAwsConfig = awsDbToSchema(dbAws)
      if (dbAwsConfig) {
        appConfig.aws = {
          ...appConfig.aws,
          ...dbAwsConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read ${awsSettingPath}: ${e.message}`)
    })
  promises.push(awsSettingPromise)

  const chargebeeSettingPromise = knexClient
    .select()
    .from<ChargebeeSettingType>(chargebeeSettingPath)
    .then(([dbChargebee]) => {
      if (dbChargebee) {
        appConfig.chargebee = {
          ...appConfig.chargebee,
          ...dbChargebee
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read chargebeeSetting: ${e.message}`)
    })
  promises.push(chargebeeSettingPromise)

  const coilSettingPromise = knexClient
    .select()
    .from<CoilSettingType>(coilSettingPath)
    .then(([dbCoil]) => {
      if (dbCoil) {
        appConfig.coil = {
          ...appConfig.coil,
          ...dbCoil
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read coilSetting: ${e.message}`)
    })
  promises.push(coilSettingPromise)

  const clientSetting = sequelizeClient.define('clientSetting', {
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    releaseName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    siteDescription: {
      type: DataTypes.STRING,
      allowNull: true
    },
    favicon32px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    favicon16px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon192px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon512px: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const clientSettingPromise = clientSetting
    .findAll()
    .then(([dbClient]) => {
      const dbClientConfig = dbClient && {
        logo: dbClient.logo,
        title: dbClient.title,
        url: dbClient.url,
        releaseName: dbClient.releaseName,
        siteDescription: dbClient.siteDescription,
        favicon32px: dbClient.favicon32px,
        favicon16px: dbClient.favicon16px,
        icon192px: dbClient.icon192px,
        icon512px: dbClient.icon512px
      }
      if (dbClientConfig) {
        appConfig.client = {
          ...appConfig.client,
          ...dbClientConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read clientSetting: ${e.message}`)
    })
  promises.push(clientSettingPromise)

  const emailSettingPromise = knexClient
    .select()
    .from<EmailSettingDatabaseType>(emailSettingPath)
    .then(([dbEmail]) => {
      const dbEmailConfig = emailDbToSchema(dbEmail)
      if (dbEmailConfig) {
        appConfig.email = {
          ...appConfig.email,
          ...dbEmailConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read emailSetting: ${e.message}`)
    })
  promises.push(emailSettingPromise)

  const instanceServerSetting = sequelizeClient.define('instanceServerSetting', {
    clientHost: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rtc_start_port: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rtc_end_port: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rtc_port_block_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    identifierDigits: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true
    },
    releaseName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    port: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    locationName: {
      type: DataTypes.STRING
    }
  })
  const instanceServerSettingPromise = instanceServerSetting
    .findAll()
    .then(([dbInstanceServer]) => {
      const dbInstanceServerConfig = dbInstanceServer && {
        clientHost: dbInstanceServer.clientHost,
        rtc_start_port: dbInstanceServer.rtc_start_port,
        rtc_end_port: dbInstanceServer.rtc_end_port,
        rtc_port_block_size: dbInstanceServer.rtc_port_block_size,
        identifierDigits: dbInstanceServer.identifierDigits,
        domain: dbInstanceServer.domain,
        releaseName: dbInstanceServer.releaseName,
        port: dbInstanceServer.port,
        mode: dbInstanceServer.mode,
        locationName: dbInstanceServer.locationName
      }
      if (dbInstanceServerConfig) {
        appConfig.instanceserver = {
          ...appConfig.instanceserver,
          ...dbInstanceServerConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read instanceServerSetting: ${e.message}`)
    })
  promises.push(instanceServerSettingPromise)

  const redisSettingPromise = knexClient
    .select()
    .from<RedisSettingType>(redisSettingPath)
    .then(([dbRedis]) => {
      const dbRedisConfig = dbRedis && {
        enabled: dbRedis.enabled,
        address: dbRedis.address,
        port: dbRedis.port,
        password: dbRedis.password
      }
      if (dbRedisConfig) {
        appConfig.redis = {
          ...appConfig.redis,
          ...dbRedisConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read redisSetting: ${e.message}`)
    })
  promises.push(redisSettingPromise)

  const serverSettingPromise = knexClient
    .select()
    .from<ServerSettingDatabaseType>(serverSettingPath)
    .then(([dbServer]) => {
      const dbServerConfig = serverDbToSchema(dbServer)
      if (dbServerConfig) {
        appConfig.server = {
          ...appConfig.server,
          ...dbServerConfig
        }
      }
    })
    .catch((e) => {
      logger.error(e, `[updateAppConfig]: Failed to read serverSetting: ${e.message}`)
    })
  promises.push(serverSettingPromise)

  await Promise.all(promises)
}
