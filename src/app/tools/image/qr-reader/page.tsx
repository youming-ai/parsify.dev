import ToolWrapper from '@/components/shared/ToolWrapper';
import { QRCodeReader } from '@/components/tools/image/qr-code-reader';

export default function QrCodeReaderPage() {
  return (
    <ToolWrapper title="QR Code Reader" description="Scan and decode QR codes from images">
      <QRCodeReader />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'QR Code Reader - Parsify',
  description: 'Scan and decode QR codes from images',
};
