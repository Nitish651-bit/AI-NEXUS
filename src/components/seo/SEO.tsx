import { Helmet } from "react-helmet-async";

const SITE_URL = "https://aiiinexus.lovable.app";
const DEFAULT_OG_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";

// Languages targeted for global reach (hreflang)
const HREFLANGS = [
  "en", "es", "fr", "de", "pt", "it", "nl",
  "hi", "bn", "ur", "ta", "te",
  "zh", "ja", "ko",
  "ar", "tr", "ru", "pl", "uk",
  "id", "vi", "th", "fil",
  "sw",
];

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string;
}

export const SEO = ({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
  keywords,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      {/* hreflang for global ranking across languages/regions */}
      <link rel="alternate" hrefLang="x-default" href={url} />
      {HREFLANGS.map((lang) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AI Nexus" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="es_ES" />
      <meta property="og:locale:alternate" content="fr_FR" />
      <meta property="og:locale:alternate" content="de_DE" />
      <meta property="og:locale:alternate" content="hi_IN" />
      <meta property="og:locale:alternate" content="zh_CN" />
      <meta property="og:locale:alternate" content="ja_JP" />
      <meta property="og:locale:alternate" content="ar_AR" />
      <meta property="og:locale:alternate" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
