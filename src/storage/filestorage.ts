import fs from 'fs'

export default class FileStorage {
  storeValue = async (path: string, value: string) => {
    await this.store(getSafePath(path), value)
  }

  retrieveValue = async (path: string) => {
    const safePath = getSafePath(path)
    if (!fs.existsSync(safePath)) return ''
    const read = await fs.promises.readFile(safePath)
    const value = Buffer.from(read).toString()
    return value
  }

  private store = async (safePath: string, value: string) => {
    await fs.promises.writeFile(safePath, `${value}`)
  }
}

export const getSafePath = (path: string) =>
  path.replaceAll('..', '').replaceAll('//', '/')
