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
  const response = await fetch(`/api${path}`, { credentials: 'include' });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.message || 'Could not download the report.', response.status);
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
}
