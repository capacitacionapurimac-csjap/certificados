import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const data = await request.json();
    
    const participant = await prisma.participant.update({
      where: { id: params.id },
      data
    });

    return NextResponse.json(participant);
  } catch (error: any) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: 'Error al actualizar participante', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    await prisma.participant.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Error al eliminar participante', details: error.message },
      { status: 500 }
    );
  }
}