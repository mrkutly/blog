import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";

interface HeaderProps {
  siteTitle: string;
}

const Header: React.FC<HeaderProps> = ({ siteTitle }) => (
  <header
    style={{
      marginBottom: `1.45rem`,
    }}
  >
    <div
      style={{
        margin: `0 auto`,
        maxWidth: 960,
        padding: `1.45rem 1.0875rem`,
      }}
    >
      <h1 style={{ margin: 0 }}>
        <Link
          to="/"
          style={{
            textDecoration: `none`,
            color: 'var(--black)',
            fontFamily: 'Poiret One',
            display: 'inline-block',
            fontSize: '2.6rem',
            borderTop: '1px solid var(--black)',
            borderRight: '1px solid var(--black)',
            padding: '5px 5px 5px 0',
          }}
        >
          {siteTitle}
        </Link>
      </h1>
    </div>
  </header>
);

Header.propTypes = {
  siteTitle: PropTypes.string,
};

Header.defaultProps = {
  siteTitle: ``,
};

export default Header;
