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
  private fontsLoaded: boolean = false;

  constructor(canvas: CanvasType) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.isNode = typeof window === 'undefined';
  }

  private async loadFont(name: string, url: string): Promise<boolean> {
    if (this.isNode) return true;

    try {
      // Verificar si la fuente ya está cargada
      const fonts = Array.from(document.fonts);
      if (fonts.some((f: any) => f.family === name)) {
        console.log(`Font ${name} already loaded`);
        return true;
      }

      console.log(`Loading font ${name} from ${url}`);
      const font = new FontFace(name, `url(${url})`);
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
      
      // Esperar a que el documento reconozca la fuente
      await document.fonts.ready;
      
      console.log(`Font ${name} loaded successfully`);
      return true;
    } catch (error) {
      console.error(`Error loading font ${name} from ${url}:`, error);
      return false;
    }
  }

  private async loadImage(src: string): Promise<ImageType> {
    if (this.isNode) {
      const { loadImage } = await import('canvas');
      return loadImage(src);
    } else {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error('Error loading image:', e);
          reject(e);
        };
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

    // Cargar fuentes solo si no están cargadas aún
    if (!this.isNode && !this.fontsLoaded) {
      console.log('Starting font loading...');
      
      const fontResults = await Promise.allSettled([
        this.loadFont("MontserratBold", "/fonts/Montserrat-Bold.ttf"),
        this.loadFont("MontserratRegular", "/fonts/Montserrat-Regular.ttf")
      ]);

      // Verificar resultados
      fontResults.forEach((result, index) => {
        const fontName = index === 0 ? 'MontserratBold' : 'MontserratRegular';
        if (result.status === 'rejected') {
          console.error(`Failed to load ${fontName}:`, result.reason);
        } else if (!result.value) {
          console.warn(`${fontName} loaded with issues`);
        }
      });

      // Esperar un poco más para asegurar que las fuentes están listas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.fontsLoaded = true;
      console.log('Fonts loading completed');
    }

    const vc = visualConfig || defaultConfig;

    const templateImg = await this.loadImage(templateSrc);

    this.canvas.width = templateImg.width || 1920;
    this.canvas.height = templateImg.height || 1080;

    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Dibujar template
    this.ctx.drawImage(templateImg, 0, 0);

    const centerX = this.canvas.width / 2;
    const nameY = (this.canvas.height * vc.nameY) / 100;
    const dateY = (this.canvas.height * vc.dateY) / 100;
    const dateX = (this.canvas.width * vc.dateX) / 100;

    const qrSize = 120;
    const qrX = 10;
    const qrY = this.canvas.height - qrSize - 10;

    // Configurar texto del nombre con fallback
    this.ctx.fillStyle = '#000000';
    this.ctx.font = `bold ${vc.nameFontSize}px MontserratBold, "Montserrat", Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Dibujar nombre
    const nameText = participant.nombres_apellidos.toUpperCase();
    this.ctx.fillText(nameText, centerX, nameY);
    
    console.log('Drew name:', nameText, 'at position:', centerX, nameY);

    // Dibujar fecha y ubicación
    if (config.issueLocation && config.issueDate) {
      this.ctx.textAlign = 'right';
      this.ctx.font = `${vc.dateFontSize}px MontserratRegular, "Montserrat", Arial, sans-serif`;
      this.ctx.fillStyle = '#000000';
      this.ctx.textBaseline = 'middle';
      
      const dateText = `${config.issueLocation}, ${config.issueDate}`;
      this.ctx.fillText(dateText, dateX, dateY);
      
      console.log('Drew date:', dateText, 'at position:', dateX, dateY);
    }

    // Generar y dibujar QR
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

        // Fondo blanco para el QR
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        // Dibujar QR
        this.ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        
        console.log('Drew QR code at position:', qrX, qrY);
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    }

    // Retornar imagen
    return this.canvas.toDataURL('image/png');
  }
}