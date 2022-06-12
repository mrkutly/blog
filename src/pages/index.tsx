import React from "react";
import { graphql, Link } from "gatsby";
import Layout from "../components/layout";
import SEO from "../components/seo";
import Postcard from "../components/Postcard";
import { IndexPageProps } from "../types";

export const BlogPostsQuery = graphql`
  query {
    posts: allMarkdownRemark(
      limit: 10
      sort: { fields: frontmatter___date, order: DESC }
    ) {
      edges {
        node {
          frontmatter {
            blurb
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

const IndexPage: React.FC<IndexPageProps> = props => {
  const { posts } = props.data;

  return (
    <Layout>
      <SEO title="Blog" />
      <section id="intro" style={{ margin: "20vh 0", height: "70vh" }}>
        <h1>hello</h1>
        <p>
          My name is Mark. I'm a software engineer and drummer. I live in NYC. I write about coding from time
          to time. Thanks for checking out my blog. Scroll down to see some
          posts.
        </p>
      </section>
      <section style={{ minHeight: "80vh" }}>
        <h1>Recent Posts</h1>
        <hr />
        <ul style={{ listStyle: "none", marginLeft: 0 }}>
          {posts.edges.map(({ node }, idx) => {
            if (idx !== posts.edges.length - 1) {
              return <Postcard post={node} key={node.fields.slug} withBreak />;
            }
            return <Postcard post={node} key={node.fields.slug} />;
          })}
        </ul>
      </section>
    </Layout>
  );
};

export default IndexPage;
