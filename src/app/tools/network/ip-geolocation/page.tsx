import ToolWrapper from '@/components/shared/ToolWrapper';
import { IPGeolocationTool } from '@/components/tools/network/ip-geolocation';

export default function IpGeolocationPage() {
  return (
    <ToolWrapper
      title="IP Geolocation Lookup"
      description="Lookup geographic information for IP addresses"
    >
      <IPGeolocationTool />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'IP Geolocation Lookup - Parsify',
  description: 'Lookup geographic information for IP addresses',
};
