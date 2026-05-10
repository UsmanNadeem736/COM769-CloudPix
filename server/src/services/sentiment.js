/**
 * Azure AI Sentiment Analysis Service
 * Replaces the local 'sentiment' library with Cloud-based NLP
 */

export async function analyzeSentiment(text) {
  const endpoint = process.env.TA_ENDPOINT; 
  const key = process.env.TA_KEY;

  // Fallback if keys are missing
  if (!endpoint || !key || !text) {
    console.warn('Azure AI Key or Endpoint missing. Defaulting to neutral.');
    return { score: 0, label: 'neutral' };
  }

  try {
    const url = `${endpoint.replace(/\/$/, '')}/text/analytics/v3.1/sentiment`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents: [{ id: '1', text: text }]
      })
    });

    if (!response.ok) {
      console.error('Azure AI API Error:', response.statusText);
      return { score: 0, label: 'neutral' };
    }

    const data = await response.json();
    const label = data.documents[0]?.sentiment || 'neutral';
    
    // Map Azure labels to scores for your database
    const scoreMap = { 'positive': 3, 'neutral': 0, 'negative': -3 };
    const score = scoreMap[label] || 0;

    console.log(`Azure AI Analysis for "${text}": ${label}`);
    return { score, label };
  } catch (error) {
    console.error('Azure AI Connection Error:', error.message);
    return { score: 0, label: 'neutral' };
  }
}
