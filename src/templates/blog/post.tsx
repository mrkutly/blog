import React from 'react';
import Layout from '../../components/layout';
import SEO from '../../components/seo';
import ReadMore from '../../components/ReadMore';
import { PageProps } from '../../types';

const Post: React.FC<PageProps> = (props) => {
  const { post, next, previous } = props.pageContext;
  const { title, blurb } = post.frontmatter;
  const { slug } = post.fields;

  return (
    <Layout>
      <SEO title={title} description={blurb} path={slug} />
      <h1>{title}</h1>
      <div style={{ background: '#ffffffaa', padding: '10px' }} dangerouslySetInnerHTML={{ __html: post.html }}></div>
      <ReadMore next={next} previous={previous} />
    </Layout>
  );
};

export default Post;