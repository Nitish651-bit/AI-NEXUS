import { VideoEditor } from "@/components/video/VideoEditor";
import { SEO } from "@/components/seo/SEO";

export default function VideoSuite() {
  return (
    <>
      <SEO
        title="AI Video Suite — Edit, Generate & Enhance Videos with AI"
        description="Professional AI-powered video editor with creative direction, filters, music search, and timeline editing. Create stunning videos in your browser with AI Nexus."
        path="/video-suite"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "AI Nexus Video Suite",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Web",
          url: "https://aiiinexus.lovable.app/video-suite",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          description:
            "AI-powered video editor with creative director, filter library, music search, and timeline editing.",
        }}
      />
      <VideoEditor />
    </>
  );
}
