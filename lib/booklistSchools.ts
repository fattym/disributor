import { api, type Booklist } from './api';

/** Published booklists, all pages. The public endpoint only returns published, active lists. */
export async function getPublishedLists(params?: { school: number }): Promise<Booklist[]> {
  const all: Booklist[] = [];
  for (let page = 1; ; page++) {
    const { data } = await api.get<Booklist[] | { results: Booklist[]; next: string | null }>('/booklists/booklists/', { params: { ...params, page, page_size: 100 } });
    if (Array.isArray(data)) return data;
    all.push(...data.results);
    if (!data.next) return all;
  }
}

/** Each school with at least one published list, once, A to Z. */
export function schoolsWithLists(lists: Pick<Booklist, 'school' | 'school_name' | 'status'>[]): { id: number; name: string }[] {
  const names = new Map(lists.filter((l) => l.status === 'published').map((l) => [l.school, l.school_name]));
  return Array.from(names, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
}
