/**
 * Azure AI Sentiment Analysis Service
 * Uses the latest 2023-04-01 Language API
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
    // Modern 2023 Language API URL
    const url = `${endpoint.replace(/\/$/, '')}/language/:analyze-text?api-version=2023-04-01`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "kind": "SentimentAnalysis",
        "parameters": {
          "modelVersion": "latest"
        },
        "analysisInput": {
          "documents": [
            {
              "id": "1",
              "language": "en",
              "text": text
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('--- AZURE AI ERROR ---');
      console.error('Status:', response.status);
      console.error('Response:', JSON.stringify(data));
      return { score: 0, label: 'neutral' };
    }

    // Extracting sentiment from the new 2023 response structure
    const sentimentResult = data.results?.documents[0];
    const label = sentimentResult?.sentiment || 'neutral';
    
    // Map Azure labels to scores for your database
    const scoreMap = { 'positive': 3, 'neutral': 0, 'negative': -3 };
    const score = scoreMap[label] || 0;

    console.log(`Azure AI Analysis (2023 API) for "${text}": ${label}`);
    return { score, label };
  } catch (error) {
    console.error('Azure AI Connection Error:', error.message);
    return { score: 0, label: 'neutral' };
  }
}
