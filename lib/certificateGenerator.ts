import { Config, Participant } from '@/types/certificate';
import QRCode from 'qrcode';

interface VisualConfig {
  nameY: number;
  nameFontSize: number;
  dateY: number;
  dateFontSize: number;
  dateX: number;
}

type CanvasType = HTMLCanvasElement | any;
type ImageType = HTMLImageElement | any;
type ContextType = CanvasRenderingContext2D | any;


export class CertificateGenerator {
  private canvas: CanvasType;
  private ctx: ContextType;
  private isNode: boolean;

  constructor(canvas: CanvasType) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.isNode = typeof window === 'undefined';
  }

  private async loadFont(name: string, url: string) {
    if (this.isNode) return;

    const font = new FontFace(name, `url(${url})`);
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
  }

  private async loadImage(src: string): Promise<ImageType> {
    if (this.isNode) {
      const { loadImage } = await import('canvas');
      return loadImage(src);
    } else {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
        img.crossOrigin = 'anonymous';
      });
    }
  }

  /**
   * Genera el certificado escribiendo sobre una plantilla existente
   * @param participant - Datos del participante
   * @param config - Configuración del evento
   * @param templateSrc - URL o base64 de la imagen de la plantilla
   * @param visualConfig - Configuración de posiciones y tamaños (opcional)
   */
  async generateFromTemplate(
    participant: Participant,
    config: Config,
    templateSrc: string,
    visualConfig?: VisualConfig
  ): Promise<string> {
    const defaultConfig: VisualConfig = {
      nameY: 44,
      nameFontSize: 48,
      dateY: 68,
      dateFontSize: 18,
      dateX: 85
    };

    if (!this.isNode) {
      await this.loadFont("MontserratBold", "/static/Montserrat-Bold.ttf");
      await this.loadFont("MontserratRegular", "/static/Montserrat-Regular.ttf");
    }


    const vc = visualConfig || defaultConfig;

    const templateImg = await this.loadImage(templateSrc);

    this.canvas.width = templateImg.width || 1920;
    this.canvas.height = templateImg.height || 1080;

    this.ctx.drawImage(templateImg, 0, 0);

    const centerX = this.canvas.width / 2;

    const nameY = (this.canvas.height * vc.nameY) / 100;
    const dateY = (this.canvas.height * vc.dateY) / 100;
    const dateX = (this.canvas.width * vc.dateX) / 100;

    const qrSize = 120;
    const qrX = 10;
    const qrY = this.canvas.height - qrSize - 10;

    this.ctx.fillStyle = '#000000';
    this.ctx.font = `bold ${vc.nameFontSize}px MontserratBold`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(participant.nombres_apellidos.toUpperCase(), centerX, nameY);

    if (config.issueLocation && config.issueDate) {
      this.ctx.textAlign = 'right';
      this.ctx.font = `${vc.dateFontSize}px MontserratRegular`;
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(`${config.issueLocation}, ${config.issueDate}`, dateX, dateY);
    }

    if (participant.qr_code) {
      try {
        const qrDataUrl = await QRCode.toDataURL(participant.qr_code, {
          width: qrSize,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        const qrImg = await this.loadImage(qrDataUrl);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        this.ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      } catch (error) {
        console.error('Error generating QR:', error);
      }
    }

    if (this.isNode) {
      return this.canvas.toDataURL('image/png');
    } else {
      return this.canvas.toDataURL('image/png');
    }
  }
}