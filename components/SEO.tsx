import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image = '/logo.jpg', // Ensure you have a default logo.jpg in /public
  url = 'https://progall.tech',
  type = 'website' 
}) => {
  const siteTitle = 'ProGall - AI Prompt Gallery';
  const fullTitle = title === 'Home' ? siteTitle : `${title} | ProGall`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Facebook / Discord (Open Graph) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="ProGall" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Google Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? "ImageObject" : "WebSite",
          "name": fullTitle,
          "description": description,
          "url": url,
          "image": image,
          "author": {
             "@type": "Organization",
             "name": "ProGall"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
