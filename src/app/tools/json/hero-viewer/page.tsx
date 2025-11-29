import ToolWrapper from '@/components/shared/ToolWrapper';
import { JsonHeroViewer } from '@/components/tools/json/json-hero-viewer';

// Sample JSON data for demonstration
const sampleJsonData = {
  name: 'John Doe',
  age: 30,
  email: 'john.doe@example.com',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    coordinates: {
      lat: 40.7128,
      lng: -74.006,
    },
  },
  hobbies: ['reading', 'swimming', 'coding'],
  education: [
    {
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      university: 'MIT',
      year: 2015,
    },
  ],
  isActive: true,
  lastLogin: null,
  metadata: {
    created: '2023-01-01T00:00:00Z',
    updated: '2024-12-20T15:30:00Z',
  },
};

export default function JsonHeroViewerPage() {
  return (
    <ToolWrapper
      title="JSON Hero Viewer"
      description="Advanced JSON viewer with beautiful UI and navigation features"
    >
      <JsonHeroViewer data={sampleJsonData} />
    </ToolWrapper>
  );
}

export const metadata = {
  title: 'JSON Hero Viewer - Parsify',
  description: 'Advanced JSON viewer with beautiful UI and navigation features',
};
