import { CloudFlareDnsUpdateRecord, IpAddressResponse } from './model'
import FileStorage from './storage/filestorage'

export const run = async () => {
  const url = process.env.CLOUDFLARE_URL || null
  const apiKey = process.env.CLOUDFLARE_API_KEY || null

  if (url === null || apiKey === null) {
    log('Url or API key is NULL.')
    return
  }

  const ipAddressFromApi = await getIpAddressFromApi()
  if (ipAddressFromApi === '') {
    log('New IP Address found for route.')
    return
  }

  const domain = 'dev.gawin.io'
  await updateDnsForDomain(domain, ipAddressFromApi, url, apiKey)
}

const updateDnsForDomain = async (
  domain: string,
  ipAddressFromApi: string,
  url: string,
  apiKey: string
) => {
  const fileStorage = new FileStorage()

  const path = `./${domain}.txt`
  const ipAddressFromFile = await getIpAddressFromFile(fileStorage, path)

  if (ipAddressFromFile !== ipAddressFromApi) {
    fileStorage.storeValue(path, ipAddressFromApi)
    log(`New IP address ${ipAddressFromApi} found for ${domain}.`)
    await updateDnsRecord(ipAddressFromApi, domain, url, apiKey)
  } else if (ipAddressFromFile === ipAddressFromApi) {
    // Skip same address
    log(`No new IP for ${domain}.`)
    return
  }
}

const getIpAddressFromFile = async (fileStorage: FileStorage, path: string) => {
  const ipAddress = await fileStorage.retrieveValue(path)
  return ipAddress
}

const getIpAddressFromApi = async () => {
  const response = await fetch('https://api.ipify.org?format=json')
  const ipAddressResponse: IpAddressResponse = {
    ip: '',
  }
  if (response.status === 200) {
    const jsonResponse: IpAddressResponse =
      (await response.json()) as IpAddressResponse
    ipAddressResponse.ip = jsonResponse.ip
  }
  return ipAddressResponse.ip
}

const updateDnsRecord = async (
  ipAddress: string,
  domain: string,
  url: string,
  apiKey: string
) => {
  const cloudFlareDnsUpdateRecord: CloudFlareDnsUpdateRecord = {
    content: ipAddress,
    name: domain,
    proxied: true,
    type: 'A',
    ttl: 60,
  }
  const headers = new Headers({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  })
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(cloudFlareDnsUpdateRecord),
  })

  if (response.status === 200) {
    log(`Record ${domain} updated to ${ipAddress} successfully`)
  } else {
    const result = await response.text()
    log(`Record ${domain} NOT updated successfully:\n${result}`)
  }
}

const padTo2Digits = (num: number) => {
  return num.toString().padStart(2, '0')
}

const formatDate = (date: Date) => {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('') +
    '-' +
    [
      padTo2Digits(date.getHours()),
      padTo2Digits(date.getMinutes()),
      padTo2Digits(date.getSeconds()),
    ].join('')
  )
}

const log = (message: string) => {
  const date = formatDate(new Date())
  console.log(date, message)
}
