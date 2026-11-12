import Image from "next/image";

export function Wordmark({ height = 32 }: { height?: number }) {
  const width = Math.round(height * (408 / 161));
  return <Image src="/wordmark.png" alt="おく" width={width} height={height} priority />;
}
