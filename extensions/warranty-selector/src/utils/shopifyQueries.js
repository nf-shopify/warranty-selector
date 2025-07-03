/**
 * GraphQL query functions for Shopify Admin API
 */

/**
 * Queries product data including variants
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} Product data response
 */
export async function queryProductData(productId) {
  const requestBody = {
    query: `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        featuredImage {
          url
        }
        variants(first: 250) {
          edges {
            node {
              id
              image {
                url
              }
              title
              price
              availableForSale
              selectedOptions {
                name
                value
              }
              metafield(namespace: "custom", key: "warranty_options") {
                id
                namespace
                key
                value
              }
            }
          }
        }
      }
    }
      `,
    variables: { id: `${productId}` },
  };
  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  return res.json();
}

/**
 * Queries product data including variants
 * @param {string} variantId - The variant ID
 * @returns {Promise<Object>} Product data response
 */
export async function queryVariantData(variantId) {
  const requestBody = {
    query: `
    query GetVariant($id: ID!) {
  productVariant(id: $id) {
    id
    displayName
    id
    image {
      url
    }
    title
    price
    availableForSale
    selectedOptions {
      name
      value
    }
    metafield(namespace: "custom", key: "warranty_options") {
      id
      namespace
      key
      value
    }
    product {
      id
      title
      featuredMedia {
        id
        preview {
          image {
            id
            url
          }
        }
      }
    }
  }
}
      `,
    variables: { id: `${variantId}` },
  };
  const res = await fetch("shopify:admin/api/graphql.json", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
  return res.json();
}
