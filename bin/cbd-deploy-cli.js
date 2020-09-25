#! /usr/bin/env node

require('../dist/util').printPkgVersion()

const Service = require('../dist/index').default
new Service().run()
