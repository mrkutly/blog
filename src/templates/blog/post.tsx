import React from 'react';
import Layout from '../../components/layout';
import { PageProps } from 'custom-types';

const Post: React.FC<PageProps> = (props) => {
  const { post } = props.pageContext;

  return <Layout>
    <h1>{post.frontmatter.title}</h1>
    <div style={{ background: '#ffffffaa', padding: '10px' }} dangerouslySetInnerHTML={{ __html: post.html }}></div>
  </Layout>;
};

export default Post;