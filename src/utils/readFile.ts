import * as fs from 'fs'

export default async function readFile(
  path: string,
  encoding = 'utf8',
): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}
