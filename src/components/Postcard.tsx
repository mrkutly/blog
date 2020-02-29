import React from 'react';
import { Link } from "gatsby";
import { Post } from '../types';

interface PostcardProps {
  post: Post;
}

const Postcard: React.FC<PostcardProps> = ({ post }) => {
  return (
    <Link to={post.fields.slug}>
      <li style={{ color: 'var(--black)' }}>
        <h3>{post.frontmatter.title}</h3>
        <p>{post.frontmatter.blurb}</p>
      </li>
    </Link>
  );
};

export default Postcard;