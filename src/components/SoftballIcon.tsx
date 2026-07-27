import Image from "next/image";

/**
 * The league mark: the SSL softball, cropped out of the season flyer
 * (public/SSLLogo.jpg) and alpha-masked to a circle so it sits on the cosmic
 * background instead of carrying the flyer's black rectangle with it.
 *
 * Served from /public by path rather than a static import — importing out of
 * public/ would ship the file twice, once as a static asset and once bundled.
 *
 * Sized entirely by `className` (e.g. "h-16 w-16"); 512 is just the source
 * resolution, which gives headroom for high-DPI screens.
 *
 * Set `priority` where the mark is above the fold so it is not lazy-loaded.
 */
export function SoftballIcon({
  className = "",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/ssl-logo.webp"
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      priority={priority}
      className={className}
    />
  );
}
