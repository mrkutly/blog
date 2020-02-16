const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
	const { createNodeField } = actions
	if (node.internal.type === `MarkdownRemark`) {
		const slug = createFilePath({ node, getNode, basePath: `pages` });
		createNodeField({
			node,
			name: `slug`,
			value: slug,
		})
	}
}

exports.createPages = ({ graphql, actions }) => {
	const { createPage } = actions

	return graphql(`
    {
      allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
						html
            fields {
              slug
            }
          }
        }
      }
    }
  `).then(result => {
		const blogPosts = result.data.allMarkdownRemark.edges;
			
		// Create blog post pages and define pagination rules
		const postsPerPage = 6
		const numPages = Math.ceil(blogPosts.length / postsPerPage)

		blogPosts.forEach(({ node }, index) => {
			const next =
				index === blogPosts.length - 1 ? null : blogPosts[index + 1].node
			const previous = index === 0 ? null : blogPosts[index - 1].node

			createPage({
				path: node.fields.slug,
				component: path.resolve(`./src/templates/blog/post.tsx`),
				context: {
					// Data passed to context is available
					// in page queries as GraphQL variables.
					slug: node.fields.slug,
					html: node.html,
					// give each page it's context in the paginitation
					previous,
					next,
					index,
					numPages,
					postsPerPage,
				},
			})
		})
	})
}