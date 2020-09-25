import * as path from 'path'
import * as fs from 'fs'
import * as ora from 'ora'
import * as chalk from 'chalk'

import { deployConfigPath } from '../config'
import { Env, Platform } from './interface'

export function getRootPath(): string {
  return path.resolve(__dirname, '../../')
}

export function getPkgVersion(): string {
  return require(path.join(getRootPath(), 'package.json')).version
}

export function printPkgVersion() {
  const deployVersion = getPkgVersion()
  console.log(`🔥🔨 cbd-deploy-cli v${deployVersion}`)
  console.log()
}

export function checkDeployConfigExists() {
  return fs.existsSync(deployConfigPath)
}

// 成功信息
export const succeed = (...message: string[]) => {
  ora().succeed(chalk.greenBright.bold(message))
}
// 提示信息
export const info = (...message: string[]) => {
  ora().info(chalk.blueBright.bold(message))
}
// 错误信息
export const error = (...message: string[]) => {
  ora().fail(chalk.redBright.bold(message))
}

// loading
export const loading = (...message: string[]) => {
  return ora(chalk.cyan(message)).start()
}

// 下划线
export const underline = (...message: string[]) => {
  return chalk.underline.blueBright.bold(message)
}

// 是否是混合项目
export const isHybrid = (env: Env) => {
  const config = require(deployConfigPath)
  return Object.keys(config[env]).some(
    (key: Platform) => ['mini', 'web', 'native'].indexOf(key) !== -1
  )
}
