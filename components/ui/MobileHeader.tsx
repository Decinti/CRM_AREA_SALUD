'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { clientConfig } from '@/lib/config'
import { createClient } from '@/lib/supabase'

export default function MobileHeader() {
  const router = useRouter()
  const primary = clientConfig.colorPrimary
  const secondary = clientConfig.colorSecondary

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: secondary }}
        >
          <Image
            src={clientConfig.logo}
            alt="Logo"
            width={32}
            height={32}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.parentElement!.innerHTML = `<span style="color:${primary};font-weight:700;font-size:14px">${clientConfig.name.charAt(0)}</span>`
            }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{clientConfig.name}</p>
          <p className="text-xs text-gray-400 truncate">{clientConfig.specialty}</p>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors shrink-0"
        title="Cerrar sesión"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </header>
  )
}
