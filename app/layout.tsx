import type { Metadata } from 'next'
import { clientConfig } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: clientConfig.name,
  description: `CRM para ${clientConfig.specialty}`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
