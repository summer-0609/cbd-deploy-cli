import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

import { Env, Platform, IOriginPrompt } from '../util/interface'

// 发布配置文件
export const deployConfigPath = path.join(process.cwd(), 'deploy.config.js')

export const InquireConfigList = [
  {
    type: 'input',
    name: 'projectName',
    message: '请输入项目名称',
    default: fs.existsSync(`${path.join(process.cwd())}/package.json`)
      ? require(`${process.cwd()}/package.json`).name
      : '',
  },
  {
    type: 'checkbox',
    name: 'deployEnvList',
    message: '请选择需要部署的环境',
    choices: [
      {
        name: 'dev',
        checked: true,
      },
      {
        name: 'prod',
      },
    ],
  },
  {
    type: 'list',
    name: 'projectType',
    message: '选择项目类型',
    choices: [
      {
        name: 'Web App',
        value: 'web',
        checked: true,
      },
      {
        name: 'Hybrid App',
        value: 'hybrid',
      },
    ],
  },
  {
    type: 'checkbox',
    name: 'platform',
    message: '选择项目类型',
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
    ],
    when: (answers) => answers.projectType === 'hybrid',
  },
  ...getPromptList(),
]

function getPromptList() {
  const envs: Env[] = ['dev', 'prod']
  const platforms: Platform[] = ['mini', 'web', 'native']
  const questions: IOriginPrompt[] = [
    {
      type: 'input',
      name: 'Script',
      message: '打包命令',
      default: 'npm run build',
    },
    {
      type: 'input',
      name: 'Host',
      message: '服务器地址',
      default: 'localhost',
    },
    {
      type: 'number',
      name: 'Port',
      message: '服务器端口号',
      default: 22,
    },
    {
      type: 'input',
      name: 'Username',
      message: '用户名',
      default: 'root',
    },
    {
      type: 'input',
      name: 'PrivateKey',
      message: '本地私钥地址(和密码二选一)',
      default: `${os.homedir()}/.ssh/id_rsa`,
    },
    {
      type: 'password',
      name: 'Password',
      message: '密码(和私钥二选一)',
    },
    {
      type: 'input',
      name: 'DistPath',
      message: '本地打包目录',
      default: 'dist',
    },
    {
      type: 'input',
      name: 'WebDir',
      message: '部署路径',
    },
    {
      type: 'confirm',
      name: 'IsRemoveRemoteFile',
      message: '是否删除远程文件',
      default: false,
    },
  ]

  const envList = envs.reduce((prev, env) => {
    const _list = questions.map((item) => ({
      ...item,
      name: `${env}${item.name}`,
      message: `${env}: ${item.message}`,
      when: (answers) =>
        answers.deployEnvList.includes(env) && answers.projectType === 'web',
    }))
    return prev.concat(
      {
        type: 'input',
        name: `${env}Name`,
        message: `${env}: 环境名称`,
        default: env === 'dev' ? '开发环境' : '生产环境',
        when: (answers) =>
          answers.deployEnvList.includes(env) && answers.projectType === 'web',
      },
      _list
    )
  }, [])

  const hybridList = envs.reduce((prev, env) => {
    const _list = platforms.map((platform) => {
      return questions.map((item) => ({
        ...item,
        name: `${env}${platform}${item.name}`,
        message: `${env}-${platform}: ${item.message}`,
        when: (answers) =>
          answers.deployEnvList.includes(env) &&
          answers.projectType === 'hybrid',
      }))
    })
    return prev.concat(
      {
        type: 'input',
        name: `${env}Name`,
        message: `${env}: 环境名称`,
        default: env === 'dev' ? '开发环境' : '生产环境',
        when: (answers) =>
          answers.deployEnvList.includes(env) &&
          answers.projectType === 'hybrid',
      },
      ..._list
    )
  }, [])

  return envList.concat(hybridList)
}
