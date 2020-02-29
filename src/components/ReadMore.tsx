import React from 'react';
import { Link } from 'gatsby';
import { Post } from '../types';

export interface ReadMoreProps {
  next?: Post;
  previous?: Post;
}

const ReadMore: React.FC<ReadMoreProps> = ({ next, previous }) => {
  const nextSlug = next?.fields.slug;
  const nextTitle = next?.frontmatter.title;
  const previousSlug = previous?.fields.slug;
  const previousTitle = previous?.frontmatter.title;

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      color: 'var(--black)',
      borderTop: '1px solid var(--black)',
      borderLeft: '1px solid var(--black)',
      borderRight: '1px solid var(--black)',
    }}>
      <p style={{ fontFamily: 'Poiret One, Lora, serif', fontSize: '1.6rem', }}>Want more of that sweet, sweet content? Here ya go.</p>
      <div style={{ display: 'flex' }}>
        {previous && <Link to={previousSlug}><i>{previousTitle}</i></Link>}
        {next && <Link to={nextSlug}><i>{nextTitle}</i></Link>}
      </div>
    </div>
  );
};

export default ReadMore;