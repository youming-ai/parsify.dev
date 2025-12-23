/**
 * Cloudflare Image Loader for Next.js
 * Uses Cloudflare's Image Resizing service
 */

interface ImageLoaderProps {
    src: string;
    width: number;
    quality?: number;
}

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
    // If it's an absolute URL, use Cloudflare Image Resizing
    if (src.startsWith('http://') || src.startsWith('https://')) {
        const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];
        return `/cdn-cgi/image/${params.join(',')}/${src}`;
    }

    // For local images, just return the path with width param
    // Cloudflare will handle optimization automatically
    if (src.startsWith('/')) {
        return src;
    }

    return src;
}
