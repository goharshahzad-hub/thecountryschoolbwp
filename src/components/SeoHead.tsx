import { Helmet } from "react-helmet-async";

const SITE_URL = "https://thecountryschoolbwp.lovable.app";

interface SeoHeadProps {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
  image?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SeoHead = ({ title, description, path, ogType = "website", image, jsonLd }: SeoHeadProps) => {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/placeholder.svg`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SeoHead;
