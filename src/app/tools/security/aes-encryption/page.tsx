import ToolWrapper from '@/components/shared/ToolWrapper';
import { AESEncryption } from '@/components/tools/security/aes-encryption';

export default function AesEncryptionPage() {
  return (
    <ToolWrapper
      title="AES Encryption Tool"
      description="Encrypt and decrypt data using AES encryption"
    >
      <AESEncryption />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'AES Encryption Tool - Parsify',
  description: 'Encrypt and decrypt data using AES encryption',
};
