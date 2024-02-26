import { CloudFlareDnsUpdateRecord, IpAddressResponse } from './model'
import FileStorage from './storage/filestorage'

export const run = async () => {
  const url = process.env.CLOUDFLARE_URL || null
  const apiKey = process.env.CLOUDFLARE_API_KEY || null

  if (url === null || apiKey === null) {
    console.log('Url or API key is NULL.')
    return
  }

  const ipAddressFromApi = await getIpAddressFromApi()
  if (ipAddressFromApi === '') {
    console.log('New IP Address found for route.')
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
    console.log(`New IP address ${ipAddressFromApi} found for ${domain}.`)
    await updateDnsRecord(ipAddressFromApi, domain, url, apiKey)
  } else if (ipAddressFromFile === ipAddressFromApi) {
    // Skip same address
    console.log(`No new IP for ${domain}.`)
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
    console.log(`Record ${domain} updated to ${ipAddress} successfully`)
  } else {
    const result = await response.text()
    console.log(`Record ${domain} NOT updated successfully:\n${result}`)
  }
}
