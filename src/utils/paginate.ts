import { API } from "../types/api/module";

export const paginateLink = (link: string, pages: number): string[] => {
  const url = new URL(link);

  url.searchParams.set("page", "1");

  const prepared_url = url
    .toString()
    .replace("clusters=true", "clusters=false")
    .replace(/per_page=(\d+)?/, "per_page=100");

  const urls: string[] = Array.from(
    Array(pages).fill(prepared_url),
    (url: string, page: number) => url.replace(/&page=(\d+)?/, `&page=${page}`)
  );

  return urls;
};

export const paginateClusters = (parse_items: API.ParseItem[]): string[] => {
  const urls = parse_items.flatMap((item) => {
    const pages: number = Math.ceil(item.count / 100);
    return paginateLink(item.url, pages);
  });

  return urls;
};