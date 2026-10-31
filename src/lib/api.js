export class ApiError extends Error {
  constructor(message, status = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function api(path, options = {}) {
  const { method = 'GET', body, signal } = options;
  const response = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Something went wrong. Please try again.',
      response.status,
      data?.details || [],
    );
  }

  return data;
}

export const fetcher = (path) => api(path.startsWith('/api') ? path.slice(4) : path);

export async function downloadFile(path, filename) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(`/api${path}`, {
      credentials: 'include',
      signal: controller.signal,
    });

    if (!response.ok) {
      // Try to read error body as text (could be JSON, HTML, or plain text)
      let errorMessage = 'Could not download the report.';
      try {
        const text = await response.text();
        errorMessage = text || errorMessage;
        // Try to parse as JSON if possible
        try {
          const json = JSON.parse(text);
          if (json?.message) errorMessage = json.message;
        } catch {
          // Not JSON, use raw text
        }
      } catch {
        /* ignore */
      }
      throw new ApiError(errorMessage, response.status);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Download timed out. Please try again.', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
