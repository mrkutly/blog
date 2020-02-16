declare module 'custom-types' {
  export interface Post {
    id: string;
    fields: {
      slug: string;
    };
    frontmatter: {
      author: string;
      blurb: string;
      date: string;
      title: string;
      thumbnail: string;
    };
  }

  export interface PageProps {
    path: string;
    "*": string;
    uri: string;
    location: object;
    navigate: Function;
    children: undefined;
    pageResources: object;
    data: object;
    pageContext: object;
  }

  export interface PostNode {
    node: Post;
  }

  export type IndexPageProps = PageProps & {
    data: {
      posts: {
        edges: PostNode[];
      };
    };
  };
}
