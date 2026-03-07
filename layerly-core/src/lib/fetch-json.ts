/**
 * Safely parse JSON from fetch response
 * Checks content-type to avoid parsing HTML as JSON
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  // Check if response is actually JSON
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(
      `Expected JSON but got ${contentType || 'unknown'}. Response: ${text.substring(0, 200)}`
    );
  }
  
  return response.json();
}
