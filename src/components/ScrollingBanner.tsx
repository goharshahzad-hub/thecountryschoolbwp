import { useWebsiteContent } from "@/hooks/useWebsiteContent";

const ScrollingBanner = () => {
  const { content } = useWebsiteContent();
  const bannerText = content.banner?.text || "The Country School, a Project of Bloomfield Hall (Since 1984), Model Town Fahad Campus, Bahawalpur. Contact No. 0322-6107000, 0305-7457171.";

  if (!bannerText.trim()) return null;

  return (
    <div className="w-full overflow-hidden bg-primary py-1.5">
      <div className="animate-marquee whitespace-nowrap">
        <span className="mx-8 text-sm font-medium text-primary-foreground">{bannerText}</span>
        <span className="mx-8 text-sm font-medium text-primary-foreground">{bannerText}</span>
        <span className="mx-8 text-sm font-medium text-primary-foreground">{bannerText}</span>
      </div>
    </div>
  );
};

export default ScrollingBanner;
