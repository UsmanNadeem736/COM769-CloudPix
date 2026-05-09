import Sentiment from 'sentiment'

const analyzer = new Sentiment()

export function analyzeSentiment(text) {
  const result = analyzer.analyze(text)
  const score = result.score

  let label = 'neutral'
  if (score > 1) label = 'positive'
  else if (score < -1) label = 'negative'

  return { score, label }
}
