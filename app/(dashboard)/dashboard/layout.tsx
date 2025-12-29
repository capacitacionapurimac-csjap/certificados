// app/dashboard/layout.tsx
'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
  Gavel
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      title: 'Participantes',
      href: '/dashboard/participants',
      icon: <Users size={20} />
    },
    {
      title: 'Certificados',
      href: '/dashboard/certificates',
      icon: <FileText size={20} />
    },
    {
      title: 'Usuarios',
      href: '/dashboard/users',
      icon: <Users size={20} />
    },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center">
              <Gavel size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900">CSJ Apurímac</span>
              <span className="text-xs text-gray-500">Certificación Digital</span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </button>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-gray-200 lg:hidden transform transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center">
                    <Gavel size={24} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900">CSJ Apurímac</span>
                    <span className="text-xs text-gray-500">Certificación Digital</span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {item.icon}
                    <span className="font-medium">{item.title}</span>
                  </button>
                ))}
              </nav>

              <div className="px-3 py-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div className="hidden md:block flex-1 max-w-md">
              <input
                type="search"
                placeholder="Buscar..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-red-600 text-white">
                        AD
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">Administrador</p>
                      <p className="text-xs text-gray-500">admin@csj-apurimac.gob.pe</p>
                    </div>
                    <ChevronDown size={16} className="text-gray-500 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}