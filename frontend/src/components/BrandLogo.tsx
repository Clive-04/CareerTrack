import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ className = "h-10 w-10", priority = false }: BrandLogoProps) {
  return (
    <Image
      src="/careertrack-logo.png"
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      priority={priority}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
