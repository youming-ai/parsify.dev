import { HashGenerator } from '@/components/tools/data/hash-generator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HashGeneratorDocs() {
  return (
    <div className="space-y-6">
      <HashGenerator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Common Use Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">Password Security</h4>
            <p className="text-gray-600 text-sm">
              Generate secure hash values for password storage and verification.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-medium">File Integrity</h4>
            <p className="text-gray-600 text-sm">
              Verify file integrity by comparing hash values before and after transmission.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Data Verification</h4>
            <p className="text-gray-600 text-sm">
              Generate checksums to ensure data hasn't been corrupted or tampered with.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Digital Signatures</h4>
            <p className="text-gray-600 text-sm">
              Create hash values as part of digital signature processes.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Algorithm Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Algorithm</th>
                  <th className="p-2 text-left">Output Length</th>
                  <th className="p-2 text-left">Security</th>
                  <th className="p-2 text-left">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">MD5</td>
                  <td className="p-2">128 bits</td>
                  <td className="p-2">
                    <span className="text-red-600">❌ Insecure</span>
                  </td>
                  <td className="p-2">Legacy systems, non-security</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">SHA-1</td>
                  <td className="p-2">160 bits</td>
                  <td className="p-2">
                    <span className="text-red-600">❌ Deprecated</span>
                  </td>
                  <td className="p-2">Legacy compatibility</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">SHA-256</td>
                  <td className="p-2">256 bits</td>
                  <td className="p-2">
                    <span className="text-green-600">✅ Secure</span>
                  </td>
                  <td className="p-2">General purpose, blockchain</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">SHA-384</td>
                  <td className="p-2">384 bits</td>
                  <td className="p-2">
                    <span className="text-green-600">✅ Secure</span>
                  </td>
                  <td className="p-2">High-security applications</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">SHA-512</td>
                  <td className="p-2">512 bits</td>
                  <td className="p-2">
                    <span className="text-green-600">✅ Most Secure</span>
                  </td>
                  <td className="p-2">Maximum security requirements</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
