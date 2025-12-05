import { Press_Start_2P } from 'next/font/google';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
});

export function Footer() {
  return (
    <footer className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className={`${pixelFont.className} group flex items-center text-xs tracking-widest text-muted-foreground/50 hover:text-primary transition-colors duration-300 cursor-default select-none`}>
        PARSIFY.DEV
        <span className="animate-pulse opacity-0 transition-opacity duration-300 group-hover:opacity-100">_</span>
      </div>
    </footer>
  );
}
