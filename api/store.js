function money(price) {
  if (!price) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency || 'USD' }).format(price.value);
}

function plainText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = async function handler(req, res) {
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  const shopUrl = process.env.FOURTHWALL_SHOP_URL || '';
  const checkoutUrl = process.env.FOURTHWALL_CHECKOUT_DOMAIN || '';
  if (!token) return res.status(200).json({ configured: false, products: [] });
  try {
    const response = await fetch(`https://storefront-api.fourthwall.com/v1/collections/all/products?storefront_token=${encodeURIComponent(token)}&size=12`);
    if (!response.ok) throw new Error(`Fourthwall returned ${response.status}`);
    const data = await response.json();
    const products = (data.results || []).filter((product) => product.state?.type !== 'SOLD_OUT').map((product) => {
      const variant = product.variants?.[0];
      const images = (product.images || []).map((item) => item.url || item.src || '').filter(Boolean);
      const image = images[0] || product.image?.url || product.thumbnail?.url || '';
      const url = product.url || '';
      return { name: product.name, description: plainText(product.description), price: money(product.price || variant?.unitPrice), image, images, url, variantId: variant?.id || '' };
    });
    return res.status(200).json({ configured: true, products, shopDomain: shopUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''), checkoutDomain: checkoutUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') });
  } catch (error) {
    return res.status(502).json({ configured: true, products: [], error: 'Unable to load the Fourthwall catalog.' });
  }
};
