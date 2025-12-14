import { Config, Participant } from '@/types/certificate';

export class CertificateGenerator {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
            img.crossOrigin = 'anonymous';
        });
    }

    /**
     * Genera el certificado escribiendo sobre una plantilla existente
     */
    async generateFromTemplate(
        participant: Participant,
        config: Config,
        templateSrc: string
    ): Promise<string> {
        // Cargar la imagen de la plantilla
        const templateImg = await this.loadImage(templateSrc);
        
        // Ajustar el canvas al tamaño de la plantilla
        this.canvas.width = templateImg.width;
        this.canvas.height = templateImg.height;

        // Dibujar la plantilla como fondo
        this.ctx.drawImage(templateImg, 0, 0);

        // ====== AJUSTA ESTAS POSICIONES SEGÚN TU PLANTILLA ======
        const centerX = this.canvas.width / 2;
        
        // Posición del nombre (ajusta el porcentaje según tu plantilla)
        const nameY = this.canvas.height * 0.44; // 44% desde arriba
        
        // Posición de la fecha
        const dateY = this.canvas.height * 0.68; // 68% desde arriba
        
        // Posición del QR
        const qrX = 80;
        const qrY = this.canvas.height - 150;

        // ====== ESCRIBIR NOMBRE DEL PARTICIPANTE ======
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(participant.nombres_apellidos.toUpperCase(), centerX, nameY);

        // ====== ESCRIBIR FECHA ======
        this.ctx.textAlign = 'right';
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText(`${config.issueLocation}, ${config.issueDate}`, this.canvas.width - 130, dateY);

        // ====== GENERAR Y COLOCAR QR CODE ======
        if (participant.qr_code) {
            try {
                const QRCode = (await import('qrcode')).default;
                const qrDataUrl = await QRCode.toDataURL(participant.qr_code, {
                    width: 100,
                    margin: 1
                });
                const qrImg = await this.loadImage(qrDataUrl);
                this.ctx.drawImage(qrImg, qrX, qrY, 100, 100);
            } catch (error) {
                console.error('Error generating QR:', error);
            }
        }

        return this.canvas.toDataURL('image/png');
    }
}