'use client'
import { Eye, EyeClosed, Gavel } from 'lucide-react'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function Login() {
    const [isOpen, setIsOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al iniciar sesión')
            }
            console.log("logeados")
            window.location.href = '/dashboard'
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar el correo')
            }

            toast('Se ha enviado un correo con las instrucciones para recuperar tu contraseña')
            setShowForgotPassword(false)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (showForgotPassword) {
        return (
            <div className=''>
                <div className='bg-primary h-1/2 absolute top-0 left-0 w-full rounded-b-[50px]'></div>
                <div className='relative z-10 w-full h-screen flex justify-center items-center'>
                    <div className='bg-white rounded-2xl shadow-2xl shadow-black min-w-lg'>
                        <div className='flex flex-col items-center gap-y-2 py-4'>
                            <div className='w-14 h-14 flex justify-center items-center bg-gray-300 rounded-full mb-2 text-secondary'>
                                <Gavel size={30} />
                            </div>
                            <h2 className='text-xl font-bold'>Recuperar Contraseña</h2>
                            <span className='text-sm text-red-700'>Apurímac</span>
                        </div>
                        <div className='p-6'>
                            <form onSubmit={handleForgotPassword} className='flex flex-col gap-y-4'>
                                {error && (
                                    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded'>
                                        {error}
                                    </div>
                                )}
                                <div className='flex flex-col gap-y-2'>
                                    <label htmlFor="email" className='font-medium'>Correo electrónico</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className='w-full py-2 px-4 rounded border outline-none'
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className='bg-secondary text-white py-2 rounded hover:bg-secondary/90 transition cursor-pointer disabled:opacity-50'
                                >
                                    {loading ? 'Enviando...' : 'Enviar correo de recuperación'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForgotPassword(false)}
                                    className='text-secondary underline text-sm'
                                >
                                    Volver al inicio de sesión
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className=''>
            <div className='bg-primary h-1/2 absolute top-0 left-0 w-full rounded-b-[50px]'></div>
            <div className='relative z-10 w-full h-screen flex justify-center items-center'>
                <div className='bg-white rounded-2xl shadow-2xl shadow-black min-w-lg'>
                    <div className='flex flex-col items-center gap-y-2 py-4'>
                        <div className='w-14 h-14 flex justify-center items-center bg-gray-300 rounded-full mb-2 text-secondary'>
                            <Gavel size={30} />
                        </div>
                        <h2 className='text-xl font-bold'>Corte Superior de Justicia</h2>
                        <span className='text-sm text-red-700'>Apurímac</span>
                        <span className='text-sm'>Sistema de certificación digital</span>
                    </div>
                    <div className='p-6'>
                        <form onSubmit={handleLogin} className='flex flex-col gap-y-4'>
                            {error && (
                                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded'>
                                    {error}
                                </div>
                            )}
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor="email" className='font-medium'>Correo</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='w-full py-2 px-4 rounded border outline-none'
                                    required
                                />
                            </div>
                            <div className='flex flex-col gap-y-2 relative'>
                                <label htmlFor="password" className='font-medium'>Contraseña</label>
                                <input
                                    type={isOpen ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className='w-full py-2 pl-4 pr-10 rounded border outline-none'
                                    required
                                />
                                {isOpen ? (
                                    <Eye size={20} className='absolute top-11 right-4 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
                                ) : (
                                    <EyeClosed size={20} className='absolute top-11 right-4 cursor-pointer' onClick={() => setIsOpen(!isOpen)} />
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className='bg-secondary text-white py-2 rounded hover:bg-secondary/90 transition cursor-pointer disabled:opacity-50'
                            >
                                {loading ? 'Iniciando...' : 'Iniciar sesión'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className='text-secondary underline text-sm'
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}