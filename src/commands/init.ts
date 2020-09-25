import * as fs from 'fs'
import * as inquirer from 'inquirer'
import * as chalk from 'chalk'

import { InquireConfigList, deployConfigPath } from '../config'
import { Env, Platform } from '../util/interface'
import { checkDeployConfigExists, error, loading } from '../util'

export default function init() {
  if (checkDeployConfigExists()) {
    error('deploy.config.js 配置文件已存在')
    process.exit(1)
  } else {
    inquirer
      .prompt(InquireConfigList)
      .then(setUpDeployJsonObject)
      .then(createConfigFile)
  }
}

// 根据用户输入生成 jsonObject
function setUpDeployJsonObject(answer) {
  const { deployEnvList, projectName, platform } = answer

  const jsonObject = {
    projectName,
  }

  const createObj = (env: Env, platform: string = '') => {
    return {
      ...(!platform && { name: answer[`${env}${platform}Name`] }),
      script: answer[`${env}${platform}Script`],
      host: answer[`${env}${platform}Host`],
      port: answer[`${env}${platform}Port`],
      username: answer[`${env}${platform}Username`],
      password: answer[`${env}${platform}Password`],
      privatekey: answer[`${env}${platform}PrivateKey`],
      distpath: answer[`${env}${platform}DistPath`],
      webdir: answer[`${env}${platform}WebDir`],
      isremoveremote: answer[`${env}${platform}IsRemoveRemoteFile`],
    }
  }

  deployEnvList.forEach((env: Env) => {
    jsonObject[env] = platform
      ? platform.reduce(
          (prev: object, platform: Platform) => {
            return Object.assign({}, prev, {
              [platform]: createObj(env, platform),
            })
          },
          { name: answer[`${env}Name`] }
        )
      : createObj(env)
  })

  return Promise.resolve({ ...jsonObject })
}

// 创建 deploy.config.js
function createConfigFile(jsonObj) {
  const spinner = loading('正在生成配置文件...')
  const str = `module.exports = ${JSON.stringify(jsonObj, null, 2)}`
  fs.writeFileSync(deployConfigPath, str)

  spinner.succeed(chalk.green('编译完成, 可以上传代码啦...'))
}
