const demoEvents = [
  { name: 'Late-night creative meetup', type: 'COMMUNITY', date: 'This week · time varies', venue: 'A local spot near you', price: 'Free / RSVP', provider: 'Eventbrite', url: 'https://www.eventbrite.com/' },
  { name: 'Free music in the park', type: 'MUSIC', date: 'This weekend · free', venue: 'Outside, ideally', price: 'Free', provider: 'Ticketmaster', url: 'https://www.ticketmaster.com/' },
  { name: 'Try something you’ve never tried', type: 'SIDE QUEST', date: 'Whenever you stop overthinking', venue: 'Somewhere new', price: 'Check listing', provider: 'Meetup', url: 'https://www.meetup.com/' }
];

module.exports = async function handler(req, res) {
  const location = String(req.query.location || '').trim();
  const category = String(req.query.category || '').trim();
  if (!location) return res.status(400).json({ error: 'A location is required.' });
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return res.status(200).json({ demo: true, events: demoEvents });

  const params = new URLSearchParams({ apikey: apiKey, size: '9', sort: 'date,asc', radius: '25', unit: 'miles' });
  if (/^\d{5}(-\d{4})?$/.test(location)) params.set('postalCode', location); else params.set('city', location);
  if (category) params.set('classificationName', category);
  try {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!response.ok) throw new Error(`Ticketmaster returned ${response.status}`);
    const data = await response.json();
    const events = (data._embedded?.events || []).sort(() => Math.random() - 0.5).slice(0, 6).map((event) => ({
      name: event.name,
      type: event.classifications?.[0]?.segment?.name || 'EVENT',
      date: event.dates?.start?.localDate || 'Date TBA',
      venue: event._embedded?.venues?.[0]?.name || 'Venue TBA',
      price: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}–$${event.priceRanges[0].max}` : 'Price on official listing',
      provider: 'Ticketmaster',
      url: event.url
    }));
    return res.status(200).json({ demo: false, events });
  } catch (error) {
    return res.status(200).json({ demo: true, events: demoEvents });
  }
};
