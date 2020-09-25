export interface IConifgInput {
  name: string
  script: string
  host: string
  port: string
  username: string
  password?: string
  privatekey?: string
  isremoveremote?: boolean
  distpath: string
  webdir: string
}

export type Env = 'dev' | 'prod'
export type Platform = 'mini' | 'web' | 'native'

export type HybridConfig = {
  [P in Platform]?: IConifgInput
}

export type PromptType =
  | 'input'
  | 'number'
  | 'confirm'
  | 'list'
  | 'rawlist'
  | 'expand'
  | 'checkbox'
  | 'password'
  | 'editor'

export interface IOriginPrompt {
  type: PromptType
  name: string
  message: string
  default?: string | boolean | number
}
