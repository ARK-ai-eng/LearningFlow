import PDFDocument from 'pdfkit';
import { storagePut } from './storage';

interface CertificateData {
  certificateNumber: string;
  userName: string;
  courseName: string;
  issuedAt: Date;
  expiresAt: Date | null;
  score: number;
  companyName?: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Upload to S3
        const fileName = `certificates/${data.certificateNumber}.pdf`;
        const { url } = await storagePut(fileName, pdfBuffer, 'application/pdf');
        resolve(url);
      });
      doc.on('error', reject);

      // Hintergrund
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');
      
      // Rahmen
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(3)
        .stroke('#1a365d');
      
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(1)
        .stroke('#3182ce');

      // Titel
      doc.fillColor('#1a365d')
        .fontSize(36)
        .font('Helvetica-Bold')
        .text('ZERTIFIKAT', 0, 80, { align: 'center' });

      doc.fillColor('#4a5568')
        .fontSize(16)
        .font('Helvetica')
        .text('KI-Kompetenz-Nachweis', 0, 130, { align: 'center' });

      // Trennlinie
      doc.moveTo(200, 160).lineTo(doc.page.width - 200, 160).stroke('#3182ce');

      // Haupttext
      doc.fillColor('#2d3748')
        .fontSize(14)
        .text('Hiermit wird bestätigt, dass', 0, 190, { align: 'center' });

      doc.fillColor('#1a365d')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text(data.userName, 0, 220, { align: 'center' });

      if (data.companyName) {
        doc.fillColor('#4a5568')
          .fontSize(12)
          .font('Helvetica')
          .text(`(${data.companyName})`, 0, 260, { align: 'center' });
      }

      doc.fillColor('#2d3748')
        .fontSize(14)
        .font('Helvetica')
        .text('die Prüfung zum Kurs', 0, 290, { align: 'center' });

      doc.fillColor('#1a365d')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(data.courseName, 0, 320, { align: 'center' });

      doc.fillColor('#2d3748')
        .fontSize(14)
        .font('Helvetica')
        .text(`mit ${data.score}% erfolgreich bestanden hat.`, 0, 360, { align: 'center' });

      // Trennlinie
      doc.moveTo(200, 400).lineTo(doc.page.width - 200, 400).stroke('#3182ce');

      // Details
      const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      };

      doc.fillColor('#4a5568')
        .fontSize(11)
        .font('Helvetica');

      const detailsY = 420;
      doc.text(`Ausgestellt am: ${formatDate(data.issuedAt)}`, 100, detailsY);
      
      if (data.expiresAt) {
        doc.text(`Gültig bis: ${formatDate(data.expiresAt)}`, 100, detailsY + 20);
      }
      
      doc.text(`Zertifikatsnummer: ${data.certificateNumber}`, doc.page.width - 350, detailsY);

      // Footer
      doc.fillColor('#718096')
        .fontSize(9)
        .text(
          'Dieses Zertifikat wurde gemäß den Anforderungen der KI-Verordnung (EU AI Act) ausgestellt.',
          0,
          doc.page.height - 80,
          { align: 'center' }
        );

      doc.text(
        'Verifizierung unter: aismarterflow-academy.manus.space/verify',
        0,
        doc.page.height - 65,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
