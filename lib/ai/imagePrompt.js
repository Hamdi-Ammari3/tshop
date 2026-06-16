export function buildImagePrompt({
  product,
  platform,
}) {

  return `
Transform the uploaded product image into
a professional ecommerce advertisement.

Product:
${product.name}

Category:
${product.category}

Platform:
${platform}

Requirements:

- Keep the product identical
- Improve lighting
- Modern premium background
- Commercial marketing style
- Add depth and shadows
- High-end ecommerce look
- No watermark
- No text on image
- No logo
- Social media ready

Instagram:
square composition

Facebook:
landscape composition
`;

}