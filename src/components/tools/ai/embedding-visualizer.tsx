'use client';

import { RelatedTools } from '@/components/tools/ai/shared/related-tools';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { buildSimilarityMatrix, findNearestNeighbors } from '@/lib/llm/embedding-visualizer';
import { useMemo, useState } from 'react';

export function EmbeddingVisualizer() {
  const [input, setInput] = useState(
    JSON.stringify(
      [
        { label: 'cat', vector: [0.2, 0.8] },
        { label: 'dog', vector: [0.3, 0.7] },
        { label: 'car', vector: [0.9, 0.1] },
      ],
      null,
      2
    )
  );

  const parsed = useMemo(() => {
    try {
      const data = JSON.parse(input) as Array<{
        label: string;
        vector: number[];
      }>;
      if (Array.isArray(data) && data.every((d) => d.label && Array.isArray(d.vector))) {
        return data;
      }
    } catch {
      // invalid
    }
    return undefined;
  }, [input]);

  const matrix = useMemo(() => (parsed ? buildSimilarityMatrix(parsed) : undefined), [parsed]);

  const neighbors = useMemo(() => (parsed ? findNearestNeighbors(parsed) : undefined), [parsed]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embedding Similarity Visualizer</CardTitle>
          <CardDescription>
            Compare embedding vectors with cosine similarity, nearest neighbors, and a similarity
            matrix.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='[{"label":"cat","vector":[0.2,0.8]},{"label":"dog","vector":[0.3,0.7]}]'
            rows={8}
          />
        </CardContent>
      </Card>

      {matrix && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Nearest neighbors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {neighbors?.map((n) => (
                    <li key={n.item} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{n.item}</span>
                      <span className="text-muted-foreground">nearest:</span>
                      <span className="font-medium">{n.nearest}</span>
                      <Badge variant="outline" className="text-xs">
                        {n.similarity.toFixed(3)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Labels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {matrix.labels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Similarity matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-1 text-left" />
                      {matrix.labels.map((label) => (
                        <th key={label} className="p-1 text-center font-medium">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.matrix.map((row, i) => (
                      <tr key={matrix.labels[i]}>
                        <td className="p-1 font-medium">{matrix.labels[i]}</td>
                        {row.map((v, j) => (
                          <td
                            key={`${i}-${j}`}
                            className="p-1 text-center"
                            style={{
                              backgroundColor: `rgba(59,130,246,${v.toFixed(2)})`,
                              color: v > 0.5 ? 'white' : 'inherit',
                            }}
                          >
                            {v.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <RelatedTools toolId="embedding-visualizer" />
    </div>
  );
}
