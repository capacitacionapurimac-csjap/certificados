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
  private static nodeFontsRegistered: boolean = false;

  constructor(canvas: CanvasType) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.isNode = typeof window === 'undefined';
  }

  /**
   * Registra fuentes en Node.js usando canvas.registerFont
   */
  private static async registerNodeFonts(): Promise<void> {
    if (CertificateGenerator.nodeFontsRegistered) {
      console.log('✓ Node fonts already registered');
      return;
    }

    try {
      const { registerFont } = await import('canvas');
      const path = await import('path');

      // Rutas absolutas a las fuentes en el servidor
      const publicDir = path.join(process.cwd(), 'public', 'fonts');
      
      console.log('📁 Font directory:', publicDir);

      // Registrar Montserrat Bold
      const boldPath = path.join(publicDir, 'Montserrat-Bold.ttf');
      registerFont(boldPath, { family: 'MontserratBold' });
      console.log('✓ Registered MontserratBold from:', boldPath);

      // Registrar Montserrat Regular
      const regularPath = path.join(publicDir, 'Montserrat-Regular.ttf');
      registerFont(regularPath, { family: 'MontserratRegular' });
      console.log('✓ Registered MontserratRegular from:', regularPath);

      CertificateGenerator.nodeFontsRegistered = true;
      console.log('✅ All Node.js fonts registered successfully');
    } catch (error) {
      console.error('❌ Error registering Node.js fonts:', error);
      throw new Error(`Failed to register fonts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Método estático para cargar fuentes en el navegador
   */
  static async ensureFontsLoaded(): Promise<void> {
    if (typeof window === 'undefined') {
      // En Node.js, usar registerFont
      return CertificateGenerator.registerNodeFonts();
    }
    
    // En el navegador, cargar con FontFace API
    if (CertificateGenerator.fontsLoaded) {
      console.log('✓ Browser fonts already loaded');
      return;
    }

    if (CertificateGenerator.fontsLoading) {
      console.log('⏳ Waiting for browser fonts to finish loading...');
      return CertificateGenerator.fontsLoading;
    }

    console.log('🔄 Starting browser font loading...');
    CertificateGenerator.fontsLoading = (async () => {
      try {
        const fonts = [
          { name: 'MontserratBold', url: '/fonts/Montserrat-Bold.ttf' },
          { name: 'MontserratRegular', url: '/fonts/Montserrat-Regular.ttf' }
        ];

        const loadPromises = fonts.map(async ({ name, url }) => {
          try {
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
        await new Promise(resolve => setTimeout(resolve, 100));
        
        CertificateGenerator.fontsLoaded = true;
        console.log('✅ All browser fonts loaded and ready');
      } catch (error) {
        console.error('❌ Error in browser font loading:', error);
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

    // Asegurar que las fuentes estén cargadas/registradas
    await CertificateGenerator.ensureFontsLoaded();

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
    // En Node.js usa solo el nombre de la familia registrada
    // En navegador usa fallbacks
    this.ctx.font = this.isNode 
      ? `bold ${vc.nameFontSize}px MontserratBold`
      : `bold ${vc.nameFontSize}px MontserratBold, Montserrat, Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const nameText = participant.nombres_apellidos.toUpperCase();
    this.ctx.fillText(nameText, centerX, nameY);

    console.log(`✍️ Drew name: "${nameText}" at (${centerX}, ${nameY})`);

    // ========== DIBUJAR FECHA Y UBICACIÓN ==========
    if (config.issueLocation && config.issueDate) {
      this.ctx.textAlign = 'right';
      this.ctx.font = this.isNode
        ? `${vc.dateFontSize}px MontserratRegular`
        : `${vc.dateFontSize}px MontserratRegular, Montserrat, Arial, sans-serif`;
      this.ctx.fillStyle = '#000000';
      this.ctx.textBaseline = 'middle';
      
      const dateText = `${config.issueLocation}, ${config.issueDate}`;
      this.ctx.fillText(dateText, dateX, dateY);
      
      console.log(`📅 Drew date: "${dateText}" at (${dateX}, ${dateY})`);
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
        
        console.log(`📱 Drew QR code at (${qrX}, ${qrY})`);
      } catch (error) {
        console.error('❌ Error generating QR:', error);
      }
    }

    const result = this.canvas.toDataURL('image/png');
    console.log('✅ Certificate generated successfully');
    return result;
  }
}