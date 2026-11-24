/** Turn an axios/DRF error into one readable summary plus per-field messages. Pure: no imports. */
export interface ParsedApiError {
  /** One sentence for a banner. */
  message: string;
  /** Field name -> message, as DRF sent them (nested errors are flattened with a path). */
  fields: Record<string, string>;
}

const flatten = (value: unknown, path: string, out: Record<string, string>) => {
  if (value == null) return;
  if (typeof value === 'string') { out[path || 'detail'] = value; return; }
  if (Array.isArray(value)) {
    const strings = value.filter((v) => typeof v === 'string') as string[];
    if (strings.length) out[path || 'detail'] = strings.join(' ');
    value.forEach((v, i) => { if (v && typeof v === 'object') flatten(v, `${path}${path ? '.' : ''}${i + 1}`, out); });
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) flatten(v, path ? `${path}.${k}` : k, out);
  }
};

export function parseApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): ParsedApiError {
  const res = (error as { response?: { status?: number; data?: unknown } })?.response;
  if (!res) {
    return { message: 'Could not reach the server. Check your connection and try again.', fields: {} };
  }
  const fields: Record<string, string> = {};
  const data = res.data;
  if (typeof data === 'string') {
    // An HTML error page (proxy/500) is not something to show a seller.
    if (!/^\s*</.test(data) && data.trim()) fields.detail = data.trim().slice(0, 300);
  } else {
    flatten(data, '', fields);
  }
  const status = res.status ?? 0;
  const detail = fields.detail || fields.non_field_errors;
  let message = fallback;
  if (status === 401) message = 'Your session has expired. Sign in again.';
  else if (status === 403) message = detail || 'You do not have permission to do this.';
  else if (status === 413) message = 'A file is too large to upload.';
  else if (status >= 500) message = 'The server had a problem. Please try again in a minute.';
  else if (detail) message = detail;
  else if (Object.keys(fields).length) message = 'Please fix the highlighted details and try again.';
  delete fields.detail;
  delete fields.non_field_errors;
  return { message, fields };
}
