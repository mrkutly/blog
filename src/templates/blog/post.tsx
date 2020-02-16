import React from 'react';
import Layout from '../../components/layout';

export default (props) => {
  const { html } = props.pageContext;

  return <Layout><h1>hello</h1><div dangerouslySetInnerHTML={{ __html: html }}></div></Layout>;
};