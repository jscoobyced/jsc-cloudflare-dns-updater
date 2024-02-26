import dotenv from 'dotenv'
import * as main from './main'

;(async () => {
  dotenv.config()
  await main.run()
})().catch((e) => {
  console.error(e)
})
