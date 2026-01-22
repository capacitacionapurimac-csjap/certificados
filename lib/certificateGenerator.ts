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
  private static fontsLoaded: boolean = false;
  private static fontsLoading: Promise<void> | null = null;

  constructor(canvas: CanvasType) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.isNode = typeof window === 'undefined';
  }

  /**
   * Método estático para cargar fuentes UNA VEZ y reutilizar en toda la app
   */
  static async ensureFontsLoaded(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    // Si ya están cargadas, retornar inmediatamente
    if (CertificateGenerator.fontsLoaded) {
      console.log('✓ Fonts already loaded');
      return;
    }

    // Si están cargando, esperar a que terminen
    if (CertificateGenerator.fontsLoading) {
      console.log('⏳ Waiting for fonts to finish loading...');
      return CertificateGenerator.fontsLoading;
    }

    // Iniciar carga
    console.log('🔄 Starting font loading...');
    CertificateGenerator.fontsLoading = (async () => {
      try {
        const fonts = [
          { name: 'MontserratBold', url: '/fonts/Montserrat-Bold.ttf' },
          { name: 'MontserratRegular', url: '/fonts/Montserrat-Regular.ttf' }
        ];

        const loadPromises = fonts.map(async ({ name, url }) => {
          try {
            // Verificar si ya existe
            const existingFonts = Array.from(document.fonts);
            if (existingFonts.some((f: any) => f.family === name)) {
              console.log(`✓ ${name} already in document.fonts`);
              return true;
            }

            console.log(`📥 Loading ${name} from ${url}`);
            const fontFace = new FontFace(name, `url(${url})`);
            const loaded = await fontFace.load();
            document.fonts.add(loaded);
            console.log(`✓ ${name} loaded successfully`);
            return true;
          } catch (error) {
            console.error(`❌ Failed to load ${name}:`, error);
            return false;
          }
        });

        await Promise.all(loadPromises);
        await document.fonts.ready;
        
        // Esperar un tick adicional para asegurar disponibilidad
        await new Promise(resolve => setTimeout(resolve, 100));
        
        CertificateGenerator.fontsLoaded = true;
        console.log('✅ All fonts loaded and ready');
      } catch (error) {
        console.error('❌ Error in font loading process:', error);
      } finally {
        CertificateGenerator.fontsLoading = null;
      }
    })();

    return CertificateGenerator.fontsLoading;
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

    // Asegurar que las fuentes estén cargadas
    if (!this.isNode) {
      await CertificateGenerator.ensureFontsLoaded();
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

    // ========== DIBUJAR NOMBRE ==========
    this.ctx.fillStyle = '#000000';
    this.ctx.font = `bold ${vc.nameFontSize}px MontserratBold, Montserrat, Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const nameText = participant.nombres_apellidos.toUpperCase();
    this.ctx.fillText(nameText, centerX, nameY);

    // ========== DIBUJAR FECHA Y UBICACIÓN ==========
    if (config.issueLocation && config.issueDate) {
      this.ctx.textAlign = 'right';
      this.ctx.font = `${vc.dateFontSize}px MontserratRegular, Montserrat, Arial, sans-serif`;
      this.ctx.fillStyle = '#000000';
      this.ctx.textBaseline = 'middle';
      
      const dateText = `${config.issueLocation}, ${config.issueDate}`;
      this.ctx.fillText(dateText, dateX, dateY);
    }

    // ========== GENERAR Y DIBUJAR QR ==========
    if (participant.qr_code) {
      try {
        const qrSize = 120;
        const qrX = 10;
        const qrY = this.canvas.height - qrSize - 10;

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
      } catch (error) {
        console.error('Error generating QR:', error);
      }
    }

    return this.canvas.toDataURL('image/png');
  }
}