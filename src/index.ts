import * as minimist from 'minimist'

import init from './commands/init'
import deploy from './commands/deploy'
import { getPkgVersion, error } from './util'

export default class Service {
  run() {
    this.parseArgs()
  }

  parseArgs() {
    const args = minimist(process.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
      },
      boolean: ['version', 'help'],
    })
    const command: string = args._[0]
    if (command) {
      switch (command) {
        case 'init':
          init()
          break
        case 'deploy':
          if (!args.mode) {
            error('请指定 mode 确定发布的环境, 参照: --modex=[env]')
            return
          }
          deploy(args.mode)
          break
      }
    } else {
      if (args.v) {
        console.log(getPkgVersion())
      } else {
        console.log('Usage: cbd-deploy-cli <command> [options]')
        console.log()
        console.log('Options:')
        console.log('  -v, --version       output the version number')
        console.log('  -h, --help          output usage information')
        console.log()
        console.log('Commands:')
        console.log('  init   create deploy.config.js')
        console.log(
          '  deploy [options]       deploy application according to the environment'
        )
      }
    }
  }
}
