/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Kode verifikasi Anda</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xsfxhwiwnxeckljhrrct.supabase.co/storage/v1/object/public/email-assets/logo.png" width="40" height="40" alt="WarungPOS" style={logo} />
        <Heading style={h1}>Konfirmasi Identitas</Heading>
        <Text style={text}>Gunakan kode di bawah ini untuk mengkonfirmasi identitas Anda:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Kode ini akan kedaluwarsa dalam waktu singkat. Jika Anda tidak meminta ini, abaikan saja email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { marginBottom: '20px', borderRadius: '8px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#141a24',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#676e7a',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#141a24',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
