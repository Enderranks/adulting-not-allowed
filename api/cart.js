module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN;
  if (!token) return res.status(503).json({ error: 'Fourthwall is not connected yet.' });
  const { action, cartId, variantId, quantity = 1 } = req.body || {};
  if (action !== 'add' || !variantId) return res.status(400).json({ error: 'A product variant is required.' });
  const base = 'https://storefront-api.fourthwall.com/v1';
  try {
    let activeCartId = cartId;
    if (!activeCartId) {
      const createResponse = await fetch(`${base}/carts?storefront_token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currency: 'USD' }) });
      if (!createResponse.ok) throw new Error('Unable to create cart.');
      activeCartId = (await createResponse.json()).id;
    }
    const addResponse = await fetch(`${base}/carts/${encodeURIComponent(activeCartId)}/add?storefront_token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ variantId, quantity: Math.max(1, Number(quantity) || 1) }] }) });
    if (!addResponse.ok) throw new Error('Unable to add item.');
    return res.status(200).json({ cart: await addResponse.json() });
  } catch (error) {
    return res.status(502).json({ error: 'Fourthwall could not update the bag.' });
  }
};
