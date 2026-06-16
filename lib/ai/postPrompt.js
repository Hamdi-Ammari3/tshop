export function buildPostPrompt({
  product,
  platform,
}) {

  return `
You are a professional ecommerce marketing expert.

Create a social media advertisement.

Platform:
${platform}

Product Name:
${product.name}

Category:
${product.category}

Price:
${product.price} TND

Description:
${product.description || ""}

Requirements:

- Write in French
- Professional tone
- Suitable for Tunisia
- Focus on benefits
- No fake claims
- No emojis overload
- Strong call to action

Return ONLY valid JSON:

{
  "headline":"",
  "caption":""
}
`;

}