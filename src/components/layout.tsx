import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useStaticQuery, graphql } from "gatsby";

import Header from "./header";
import "./layout.css";
import { randomColor, randomShape } from "../utils";

const Layout: React.FC = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  useEffect(() => {
    const css = `
      body:after {
        content: "";
        height: 100vh;    
        clip-path: polygon(0 79%, 100% 100%, 100% 0);
        -webkit-clip-path: polygon(0 79%, 100% 100%, 100% 0);
        background: ${randomColor()};
        display: block;
        position: fixed;
        top: 0;
        right: 0;
        width: 100vw;
        z-index: -1;
      }

      body:before {
        content: "";
        -webkit-clip-path: ${randomShape()};
        height: 100vh;
        background: ${randomColor()};
        display: block;
        position: fixed;
        top: 0;
        right: 0;
        width: 100vw;
        z-index: -1;
      }
    `;

    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.append(style);
  }, []);

  return (
    <>
      <Header siteTitle={data.site.siteMetadata.title} />
      <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}
      >
        <main>{children}</main>
      </div>
    </>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
