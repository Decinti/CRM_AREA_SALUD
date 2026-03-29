export const clientConfig = {
  name: process.env.NEXT_PUBLIC_CLIENT_NAME ?? 'CRM Clínica',
  specialty: process.env.NEXT_PUBLIC_CLIENT_SPECIALTY ?? '',
  logo: process.env.NEXT_PUBLIC_CLIENT_LOGO ?? '/logo.png',
  colorPrimary: process.env.NEXT_PUBLIC_COLOR_PRIMARY ?? '#534AB7',
  colorSecondary: process.env.NEXT_PUBLIC_COLOR_SECONDARY ?? '#EEEDFE',
}
