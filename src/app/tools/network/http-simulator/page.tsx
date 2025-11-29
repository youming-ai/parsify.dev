import ToolWrapper from '@/components/shared/ToolWrapper';
import { HTTPRequestSimulator } from '@/components/tools/network/http-request-simulator';

export default function HttpRequestSimulatorPage() {
  return (
    <ToolWrapper
      title="HTTP Request Simulator"
      description="Simulate and test HTTP requests with various methods and headers"
    >
      <HTTPRequestSimulator />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'HTTP Request Simulator - Parsify',
  description: 'Simulate and test HTTP requests with various methods and headers',
};
