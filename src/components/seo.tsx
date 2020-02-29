import React from "react";
import Helmet from "react-helmet";
import { useStaticQuery, graphql } from "gatsby";

interface Meta {
  property?: string;
  name?: string;
  content: string;
}

interface SEOProps {
  description?: string;
  lang?: string;
  meta?: Meta[];
  title: string;
  path?: string;
}

interface SiteMetadata {
  title: string;
  description: string;
  author: string;
  url: string;
}

type SiteQueryResult = {
  site: {
    siteMetadata: SiteMetadata;
  };
  siteLogo: {
    childImageSharp: {
      fixed: {
        src: string;
      };
    };
  };
};

const SEO: React.FC<SEOProps> = ({ description, lang, meta, title, path }) => {
  const { site, siteLogo }: SiteQueryResult = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
            url
          }
        }
        siteLogo: file(relativePath: {eq: "logo.png"}) {
          childImageSharp {
            fixed(width: 300) {
              src
            }
          }
        }
      }
    `
  );


  let canonicalUrl = site.siteMetadata.url;
  if (path) {
    canonicalUrl += path;
  }

  const logoSrc = site.siteMetadata.url + siteLogo.childImageSharp.fixed.src;
  const metaDescription = description || site.siteMetadata.description;

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | ${site.siteMetadata.title}`}
      meta={[
        ...meta,
        {
          name: `image`,
          content: logoSrc,
        },
        {
          name: `description`,
          content: metaDescription,
        },

        // facebook stuff
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:image`,
          content: logoSrc,
        },
        {
          property: `og:url`,
          content: canonicalUrl,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `blog`,
        },
        // twitter stuff
        {
          name: `twitter:image`,
          content: logoSrc,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:url`,
          content: canonicalUrl,
        },
        {
          name: `twitter:creator`,
          content: site.siteMetadata.author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
      ]}
    >
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
};

SEO.defaultProps = {
  lang: `en`,
  meta: [],
  description: ``,
};

export default SEO;;
