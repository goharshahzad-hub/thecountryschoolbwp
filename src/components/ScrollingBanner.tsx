import { useWebsiteContent } from "@/hooks/useWebsiteContent";

const ScrollingBanner = () => {
  const { content } = useWebsiteContent();
  const banner = content.banner;

  if (!banner?.enabled || !banner?.text?.trim()) return null;

  return (
    <div className="w-full overflow-hidden bg-primary py-1.5">
      <div className="animate-marquee whitespace-nowrap">
        <span className="mx-8 text-sm font-medium text-primary-foreground">{banner.text}</span>
        <span className="mx-8 text-sm font-medium text-primary-foreground">{banner.text}</span>
        <span className="mx-8 text-sm font-medium text-primary-foreground">{banner.text}</span>
      </div>
    </div>
  );
};

export default ScrollingBanner;
