import { CloudFlareDnsUpdateRecord, IpAddressResponse } from './model'

export const run = async () => {
  const url = process.env.CLOUDFLARE_URL || null
  const apiKey = process.env.CLOUDFLARE_API_KEY || null

  if (url === null || apiKey === null) {
    console.log('Url or API key is NULL.')
    return
  }

  const ipAddress = await getIpAddress()
  if (ipAddress === '') {
    console.log('No IP address found.')
    return
  }
  const domain = 'dev.gawin.io'

  await updateDnsRecord(ipAddress, domain, url, apiKey)
}

const getIpAddress = async () => {
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
