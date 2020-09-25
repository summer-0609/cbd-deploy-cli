<p align='center'>
<img src='./public/logo.png' height="200" width="200" alt="modoo logo">
</p>

<h1 align="center">cbd-deploy-cli</h1>
<div align="center">

🔥🔨 前端一键自动部署工具

![npm](https://img.shields.io/npm/v/cbd-deploy-cli)
![npm](https://img.shields.io/npm/dt/cbd-deploy-cli)
![npm](https://img.shields.io/npm/l/cbd-deploy-cli)
![](https://img.shields.io/bundlephobia/minzip/cbd-deploy-cli)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/cbd-deploy-cli)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

</div>

## 🍙 安装

全局安装
```bash
npm install cbd-deploy-cli -g
```

本地安装

```shell
npm install cbd-deploy-cli --save-dev
```

## 📦 初始化配置文件

```bash
cbd-deploy-cli init
```

根据提示填写内容，会在项目根目录下生成 `deploy.config.js` 文件，也可以手动编辑进行配置（推荐）

### 环境
- env
- prod

### 项目类型
1. web (默认)

`web` 类型下根据环境 `dev` | `prod` 生成类似以下的结构：

```javascript
// deploy.config.js
module.exports = {
  "projectName": "cbd-deploy-cli",
  // 开发环境
  "dev": {
    "name": "开发环境",  // 环境名称
    "script": "npm run build", // 打包命令
    "host": "localhost", // 服务器地址
    "port": 22, // 服务器端口号
    "username": "root", // 服务器登录用户名
    "password": "", // 服务器登录密码
    "privatekey": "xxxx/.ssh/id_rsa", // 服务器对应本地私钥
    // password | privatekey 选填一个就可以
    "distpath": "dist", // 本地打包生成目录
    "webdir": "/",  // 服务器部署路径（不可为空或'/'）
    "isremoveremote": false // 是否删除远程文件（这里是目录删除，请谨慎开启，上传解压后会自动覆盖）
  },
  // 生产环境
  "prod": {
    "name": "生产环境",
    "script": "npm run build",
    "host": "localhost",
    "port": 22,
    "username": "root",
    "password": "",
    "privatekey": "xxxx/.ssh/id_rsa",
    "distpath": "dist",
    "webdir": "/",
    "isremoveremote": false
  }
}
```

2. hybrid

`hybrid` 主要是根据目前团队 `Hybrid App` 项目的需求添加的定制化，方便统一部署到 `mini` | `web` | `native` 三个平台以节省发布时间

生成的结构如下所示：

```javascript
module.exports = {
  "projectName": "cbd-deploy-cli",
  // 开发环境
  "dev": {
    "name": "开发环境", // 这里注意一下区别
    // 小程序
    "mini": {
      "script": "npm run build",
      "host": "localhost",
      "port": 22,
      "username": "root",
      "password": "",
      "privatekey": "xxx/.ssh/id_rsa",
      "distpath": "dist",
      "webdir": "",
      "isremoveremote": false
    },
    // web
    "web": {
      "script": "npm run build",
      "host": "localhost",
      "port": 22,
      "username": "root",
      "password": "",
      "privatekey": "xxx/.ssh/id_rsa",
      "distpath": "dist",
      "webdir": "",
      "isremoveremote": false
    },
    // 原生
    "native": {
      "script": "npm run build",
      "host": "localhost",
      "port": 22,
      "username": "root",
      "password": "",
      "privatekey": "xxx/.ssh/id_rsa",
      "distpath": "dist",
      "webdir": "",
      "isremoveremote": false
    }
  }
}
```

## 🔨 部署

注意：命令后面需要加 `--mode` 环境对象 （如：`--mode=dev` 或者 `--mode dev`）

```bash
cbd-deploy-cli deploy --mode=dev    
```

输入 `Y` 确认后即可开始自动部署, 其中 `Hybrid` 类型需要选择发布的平台，之后会一起发布，不需要再次操作什么
