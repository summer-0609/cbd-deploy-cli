import * as archiver from 'archiver'
import * as inquirer from 'inquirer'
import * as ora from 'ora'
import * as fs from 'fs'

import { execSync } from 'child_process'
import { NodeSSH } from 'node-ssh'
import { deployConfigPath } from '../config'
import { isHybrid, succeed, error, underline, info } from '../util'
import { IConifgInput, Env, Platform, HybridConfig } from '../util/interface'
import { platform } from 'os'

const ssh = new NodeSSH()
const maxBuffer: number = 5000 * 1024

let isHybridApp = false

export default async function deploy(env: Env) {
  const config = require(deployConfigPath)
  const { projectName } = config

  if (!config[env]) {
    error('环境名不正确，请指定 develop.config.js 中定义的环境')
    return
  }

  const envConfig = Object.assign(config[env], {})

  isHybridApp = isHybrid(env)

  // 检测配置文件
  await checkOutDeployConifg(envConfig, env)

  const { confirm, platforms } = await confirmDeploy(projectName, envConfig)

  if (confirm) {
    if (!platforms) {
      await processDeploy(envConfig)
    } else {
      for (let plat of platforms) {
        await processDeploy(envConfig[plat], plat)
      }
    }

    succeed(
      `恭喜您，${underline(projectName)} 项目已在 ${underline(
        envConfig.name
      )} 部署成功\n`
    )

    process.exit(0)
  } else {
    process.exit(1)
  }
}

const checkOutDeployConifg = async (envConfig, env: Env) => {
  if (isHybridApp) {
    Object.keys(envConfig as HybridConfig)
      .slice(1)
      .forEach(async (plat: Platform) => {
        if (['mini', 'web', 'native'].indexOf(plat) === -1) {
          error('Hybrid 项目只支持 mini/web/native 三种类型，请修改配置文件')
          process.exit(1)
        } else {
          await checkEnvConifg(envConfig[plat], env)
        }
      })
  } else {
    await checkEnvConifg(envConfig, env)
  }
}

const processDeploy = async (envConfig: IConifgInput, platform?: Platform) => {
  const taskList = [executeScript, buildZip, connectSSH]
  if (envConfig.isremoveremote) {
    taskList.push(removeRemoteFile)
  }

  taskList.push(uploadLocalFile, unzipRemoteFile, removeZipFile, disconnectSSH)

  if (platform) {
    console.log()
    console.log(`提示：目前发布的平台: ${platform}`)
  }

  await executeTask(taskList, envConfig)
}

const checkEnvConifg = (config: IConifgInput, env: Env) => {
  const keys: Array<keyof IConifgInput> = [
    'script',
    'host',
    'port',
    'username',
    'distpath',
    'webdir',
  ]

  if (!isHybridApp) {
    keys.push('name')
  }

  return new Promise((resolve, reject) => {
    if (!config) {
      return reject(
        '未找到 deploy.config.js 文件, 请使用 cbd-deploy-cli init 命令创建'
      )
    }
    if (!isHasPPKOrPwd(config)) {
      return reject(
        `配置错误: 请配置 ${underline('privatekey')} 或 ${underline(
          'passwrod'
        )}`
      )
    }
    keys.forEach((key) => {
      if (!config[key] || config[key] === '/') {
        return reject(
          `配置错误: ${underline(`${env}环境`)} ${underline(
            `${key}属性`
          )} 配置不正确`
        )
      }
    })
    resolve({})
  }).catch((err) => {
    error(err)
    process.exit(1)
  })
}

function isHasPPKOrPwd(config: IConifgInput) {
  const { privatekey, password } = config
  if (!privatekey && !password) {
    return false
  }
  return true
}

// 是否确认部署
const confirmDeploy = (projectName: string, envConfig: IConifgInput) => {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `${underline(projectName)} 项目是否部署到 ${underline(
        envConfig.name
      )}?`,
    },
    isHybridApp && {
      type: 'checkbox',
      name: 'platforms',
      message: '请选择项目发布的平台',
      choices: [
        {
          name: '小程序',
          value: 'mini',
          checked: true,
        },
        {
          name: 'Web',
          value: 'web',
        },
        {
          name: 'Native App',
          value: 'native',
        },
      ].filter((item) => Object.keys(envConfig).indexOf(item.value) !== -1),
    },
  ])
}

// 执行打包命令
const executeScript = (config: IConifgInput, index: number) => {
  const { script } = config
  console.log(`(${index}) ${script}`)

  return new Promise((resolve, reject) => {
    const spinner = ora('正在执行构建命令\n').start()
    try {
      execSync(script, { cwd: process.cwd(), maxBuffer })
      spinner.stop()
      succeed('构建成功')
      resolve({})
    } catch (err) {
      spinner.stop()
      reject(error)
    }
  }).catch((err) => {
    error(err)
    process.exit(1)
  })
}

// 压缩
const buildZip = (config: IConifgInput, index: number) => {
  return new Promise((resolve, reject) => {
    console.log(`(${index}) 打包 ${underline(config.distpath)} Zip`)

    const output = fs
      .createWriteStream(`${process.cwd()}/${config.distpath}.zip`)
      .on('error', (e) => {
        if (e) {
          error(`打包zip出错: ${e}`)
          reject(e)
        }
      })
      .on('finish', () => {
        succeed(`${underline(`${config.distpath}.zip`)} 打包成功`)
        resolve({})
      })

    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    })

    archive.pipe(output)
    archive.directory(config.distpath, false)
    archive.finalize()
  })
}

// 连接ssh
const connectSSH = async (config: IConifgInput, index: number) => {
  try {
    console.log(`(${index}) ssh连接 ${underline(config.host)}`)
    await ssh.connect({
      ...config,
      privateKey: config.privatekey,
    })
    succeed('ssh连接成功')
  } catch (e) {
    error(e)
    process.exit(0)
  }
}

const executeTask = async (taskList: Array<Function>, config: IConifgInput) => {
  for (let index in taskList) {
    try {
      const exectued = taskList[index]
      await exectued(config, +index + 1)
    } catch (err) {
      error(err)
      process.exit(1)
    }
  }
}

// 上传本地文件
const uploadLocalFile = async (config: IConifgInput, index: number) => {
  try {
    const localFileName = `${config.distpath}.zip`
    const remoteFileName = `${config.webdir}/${config.distpath}.zip`
    const localPath = `${process.cwd()}/${localFileName}`

    console.log(`(${index}) 上传打包zip至目录 ${underline(config.webdir)}`)

    const spinner = ora('正在上传中\n').start()

    await ssh
      .putFile(localPath, remoteFileName, null, {
        concurrency: 1,
      })
      .then(null, (err) => {
        console.log(err)
      })

    spinner.stop()
    succeed('上传成功')
  } catch (e) {
    error(`上传失败: ${e}`)
    process.exit(1)
  }
}

// 删除远程文件
const removeRemoteFile = async (config: IConifgInput, index: number) => {
  try {
    const { webdir } = config
    console.log(`(${index}) 删除远程文件 ${underline(webdir)}`)

    await ssh.execCommand(`rm -rf ${webdir}`)
    succeed('删除成功')
  } catch (e) {
    error(e)
    process.exit(1)
  }
}

// 解压远程文件
const unzipRemoteFile = async (config: IConifgInput, index: number) => {
  const { webdir, distpath } = config
  const remoteFileName = `${webdir}/${distpath}.zip`

  console.log(`(${index}) 解压远程文件 ${underline(remoteFileName)}`)

  await ssh
    .execCommand(
      `unzip -o ${remoteFileName} -d ${webdir} && rm -rf ${remoteFileName}`
    )
    .then(({ stderr }) => {
      if (stderr) {
        error('STDERR: ' + stderr)
        return Promise.reject(stderr)
      }
      succeed('解压成功')
    })
    .catch((err) => {
      if (err.includes('unzip: command not found')) {
        info('yum 自动安装 unzip...')
        ssh.execCommand('yum install -y unzip zip').then(({ stderr }) => {
          if (!stderr) {
            unzipRemoteFile(config, index)
          }
        })
      } else {
        process.exit(1)
      }
    })
}

// 删除本地打包文件
const removeZipFile = async (config: IConifgInput, index: number) => {
  const { distpath } = config
  const localPath = `${process.cwd()}/${distpath}.zip`

  console.log(`(${index}) 删除本地打包文件 ${underline(localPath)}`)
  fs.unlinkSync(localPath)
  succeed('删除本地打包文件成功')
}

// 断开ssh
const disconnectSSH = async () => {
  ssh.dispose()
}
