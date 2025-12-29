'use client'
import { Eye, EyeClosed, Gavel } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export default function ResetPassword() {
    const [isOpen, setIsOpen] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [token, setToken] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token')
        if (tokenFromUrl) {
            setToken(tokenFromUrl)
        } else {
            setError('Token no válido')
        }
    }, [searchParams])

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al restablecer la contraseña')
            }

            toast('Contraseña restablecida exitosamente')
            router.push('/login')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
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
                        <h2 className='text-xl font-bold'>Restablecer Contraseña</h2>
                        <span className='text-sm text-red-700'>Apurímac</span>
                    </div>
                    <div className='p-6'>
                        <form onSubmit={handleResetPassword} className='flex flex-col gap-y-4'>
                            {error && (
                                <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded'>
                                    {error}
                                </div>
                            )}
                            <div className='flex flex-col gap-y-2 relative'>
                                <label htmlFor="password" className='font-medium'>Nueva Contraseña</label>
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
                            <div className='flex flex-col gap-y-2'>
                                <label htmlFor="confirmPassword" className='font-medium'>Confirmar Contraseña</label>
                                <input
                                    type={isOpen ? "text" : "password"}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className='w-full py-2 px-4 rounded border outline-none'
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !token}
                                className='bg-secondary text-white py-2 rounded hover:bg-secondary/90 transition cursor-pointer disabled:opacity-50'
                            >
                                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
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