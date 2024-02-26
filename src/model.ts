export type CloudFlareDnsUpdateRecord = {
  content: string,
  name: string,
  proxied: boolean,
  type: string,
  ttl: number
}

export type IpAddressResponse = {
  ip: string
}
