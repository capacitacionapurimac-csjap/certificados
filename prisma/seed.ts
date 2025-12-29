// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const existingUser = await prisma.user.findUnique({
      where: { email: 'freedom01022001@gmail.com' }
    })

    if (existingUser) {
      console.log('Usuario ya existe, actualizando...')
      const user = await prisma.user.update({
        where: { email: 'freedom01022001@gmail.com' },
        data: {
          password: hashedPassword,
          name: 'Administrador',
          role: 'admin',
        }
      })
      console.log('Usuario actualizado:', { email: user.email, name: user.name })
    } else {
      console.log('Creando nuevo usuario...')
      const user = await prisma.user.create({
        data: {
          email: 'freedom01022001@gmail.com',
          password: hashedPassword,
          name: 'Administrador',
          role: 'admin',
        }
      })
      console.log('Usuario creado:', { email: user.email, name: user.name })
    }

    console.log('Seed completado exitosamente!')
  } catch (error) {
    console.error('Error durante el seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })