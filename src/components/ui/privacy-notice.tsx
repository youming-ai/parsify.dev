export function PrivacyNotice({ message }: { message: string }) {
  return (
    <div className="mb-8 border-l-4 border-yellow-500 bg-yellow-100 p-4 font-mono text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
      <strong className="uppercase">[ Privacy Notice ]</strong>
      <br />
      {message}
    </div>
  );
}
