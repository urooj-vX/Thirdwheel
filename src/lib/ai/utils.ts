/**
 * Helper to determine if input text is a question or a plain statement.
 */
export function isQuestion(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.includes('?')) return true;

  const questionWords = [
    'who', 'what', 'where', 'when', 'why', 'how',
    'is', 'are', 'was', 'were', 'can', 'could',
    'should', 'would', 'does', 'do', 'did', 'has',
    'have', 'had', 'am', 'will', 'isnt', 'arent', 'shouldnt', 'wouldnt', 'dont', 'doesnt'
  ];

  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  return questionWords.includes(firstWord);
}
