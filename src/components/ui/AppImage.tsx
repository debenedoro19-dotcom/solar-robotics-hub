import { memo, useCallback, useState } from "react";

interface AppImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: "lazy" | "eager";
}

const AppImage = memo(function AppImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = "/assets/images/no_image.png",
  loading = "lazy",
}: AppImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }
  }, [hasError, imageSrc, fallbackSrc]);

  const shared = {
    src: imageSrc,
    alt,
    onError: handleError,
    ...(onClick ? { onClick } : {}),
    ...(sizes ? { sizes } : {}),
    ...(priority
      ? { loading: "eager" as const, fetchPriority: "high" as const }
      : { loading }),
  };

  if (fill) {
    return (
      <img
        {...shared}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <img
      {...shared}
      width={width ?? 400}
      height={height ?? 300}
      className={className}
    />
  );
});

export default AppImage;
