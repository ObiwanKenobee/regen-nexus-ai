import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
  noIndex?: boolean;
}

const defaultTitle = 'RDX Platform | Regenerative Development Exchange';
const defaultDescription =
  'AI-driven platform for climate-linked economic transformation. Connecting community-led innovation with global capital across Africa.';
const defaultOgImage = 'https://lovable.dev/opengraph-image-p98pqg.png';

export const SEOHead = ({
  title,
  description = defaultDescription,
  keywords = 'regenerative finance, climate investment, Africa development, sustainable capital, impact investing',
  ogImage = defaultOgImage,
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    const fullTitle = title ? `${title} | RDX Platform` : defaultTitle;
    document.title = fullTitle;

    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Standard meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow');
    }

    // Open Graph tags
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:image', ogImage, true);
    
    if (canonicalUrl) {
      updateMeta('og:url', canonicalUrl, true);
      
      // Update canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Twitter tags
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Cleanup function to reset title on unmount
    return () => {
      document.title = defaultTitle;
    };
  }, [title, description, keywords, ogImage, ogType, canonicalUrl, noIndex]);

  return null;
};

export default SEOHead;
