import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Base64StringDocs() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">How Base64 Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div>
            <h4 className="mb-2 font-medium font-mono text-sm">Binary to Text</h4>
            <p className="text-muted-foreground text-sm">
              Base64 converts binary data into a text format using 64 different ASCII characters.
              This makes it safe to transmit binary data over text-based protocols like email.
            </p>
          </div>
          <div>
            <h4 className="mb-2 font-medium font-mono text-sm">Encoding Process</h4>
            <ol className="list-inside list-decimal space-y-1 text-muted-foreground text-sm">
              <li>Binary data is split into 6-bit groups</li>
              <li>Each 6-bit group maps to one of 64 characters</li>
              <li>Characters include A-Z, a-z, 0-9, + and /</li>
              <li>Padding with = characters if needed</li>
            </ol>
          </div>
          <div>
            <h4 className="mb-2 font-medium font-mono text-sm">Example Dump</h4>
            <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs">
              <div>Text: "Hi"</div>
              <div>Binary: 01001000 01101001</div>
              <div>6-bit groups: 010010 000110 1001</div>
              <div>Padding: 010010 000110 1001 000000</div>
              <div>Base64: "SGk="</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Use Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <h4 className="mb-1 font-medium text-xs text-primary">Email Attachments</h4>
              <p className="text-muted-foreground text-xs">
                Encode binary files for safe transmission in email messages.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-xs text-primary">Data URLs</h4>
              <p className="text-muted-foreground text-xs">
                Embed images and files directly in HTML/CSS using data: URLs.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-xs text-primary">API Requests</h4>
              <p className="text-muted-foreground text-xs">
                Transmit binary data in JSON API requests and responses.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-xs text-primary">Config Files</h4>
              <p className="text-muted-foreground text-xs">
                Store binary data in text-based configuration files.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-muted/10 border-b pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Charset Table</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="rounded border bg-muted/5 p-2">A-Z (26)</div>
              <div className="rounded border bg-muted/5 p-2">a-z (26)</div>
              <div className="rounded border bg-muted/5 p-2">0-9 (10)</div>
              <div className="rounded border bg-muted/5 p-2">+ / (2)</div>
            </div>
            <div className="mt-4 rounded border border-blue-500/10 bg-blue-500/5 p-3">
              <p className="text-blue-600 dark:text-blue-400 text-xs font-mono font-medium">
                <strong>TOTAL: 64 CHARS</strong>
                <br />
                (6 bits per char)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Data URL Schema</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/50 p-3 font-mono text-xs overflow-x-auto">
              data:[&lt;mediatype&gt;][;base64],&lt;data&gt;
            </div>
            <div className="grid gap-4 md:grid-cols-3 font-mono text-xs">
              <div>
                <h4 className="mb-1 font-medium text-primary">Format</h4>
                <p className="text-muted-foreground">
                  "Hello" encoded in Base64 with data URL prefix
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-primary">Example</h4>
                <p className="break-all text-muted-foreground">data:text/plain;base64,SGVsbG8=</p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-primary">Usage</h4>
                <p className="text-muted-foreground">
                  Direct use in HTML img tags, CSS backgrounds
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
