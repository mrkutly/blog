import React from 'react';
import { Link } from "gatsby";
import { Post } from 'custom-types';

interface PostcardProps {
  post: Post;
}

const Postcard: React.FC<PostcardProps> = ({ post }) => {

  return <Link to={post.fields.slug}><h2>{post.frontmatter.title}</h2></Link>;
};

export default Postcard;