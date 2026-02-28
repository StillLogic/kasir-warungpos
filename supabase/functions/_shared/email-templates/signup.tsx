/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Konfirmasi email Anda untuk {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xsfxhwiwnxeckljhrrct.supabase.co/storage/v1/object/public/email-assets/logo.png" width="40" height="40" alt={siteName} style={logo} />
        <Heading style={h1}>Konfirmasi Email Anda</Heading>
        <Text style={text}>
          Terima kasih telah mendaftar di{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Silakan konfirmasi alamat email Anda (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) dengan mengklik tombol di bawah:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verifikasi Email
        </Button>
        <Text style={footer}>
          Jika Anda tidak membuat akun ini, abaikan saja email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(152, 60%, 40%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
