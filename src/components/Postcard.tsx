import React from 'react';
import { Link } from "gatsby";
import { Post } from '../types';

interface PostcardProps {
  post: Post;
  withBreak?: boolean;
}

const Postcard: React.FC<PostcardProps> = ({ post, withBreak }) => {
  return (
    <li>
      <Link to={post.fields.slug} style={{ color: 'var(--black)' }}>
        <h3>{post.frontmatter.title}</h3>
        <p>{post.frontmatter.blurb}</p>
      </Link>
      {withBreak && <hr style={{ margin: '20px 0' }} />}
    </li>
  );
};

export default Postcard;