import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import SEO from "../components/seo";
import Postcard from "../components/Postcard";
import { IndexPageProps } from "custom-types";

export const BlogPostsQuery = graphql`
  query {
    posts: allMarkdownRemark {
      edges {
        node {
          frontmatter {
            author
            blurb
            date
            title
          }
          fields {
            slug
          }
        }
      }
    }
  }
`;

const IndexPage: React.FC<IndexPageProps> = (props) => {
  const { posts } = props.data;

  return (
    <Layout>
      <SEO title="home" />
      {posts.edges.map(({ node }) => (
        <Postcard post={node} />
      ))}
    </Layout>
  );
};

export default IndexPage;
