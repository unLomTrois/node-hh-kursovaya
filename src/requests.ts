import { chunk, partition } from "lodash-es";
import fetch from "node-fetch";
import { existsSync, readFileSync } from "node:fs";
import { analyzeClusters } from "./analyze.js";
import { fetchCache } from "./fetch-cache.js";
import { formatClusters, queryToString } from "./format.js";
import { saveToFile } from "./save.js";
import { API } from "./types/api/module";

const hh_headers = {
  "User-Agent": "labor-market-analyzer (vadim.kuz02@gmail.com)",
};

export const getVacanciesInfo = async (url: string): Promise<API.Response> => {
  const data: API.Response = await fetch(
    url.match(/[_\.!~*'()-]/) && url.match(/%[0-9a-f]{2}/i)
      ? url
      : encodeURI(url),
    {
      headers: hh_headers,
    }
  ).then((res) => res.json());

  return data;
};

export const buildQueryURL = (raw_query: API.Query) => {
  const query = queryToString(raw_query);

  return "https://api.hh.ru/vacancies?" + query;
};

export const getClusters = (response: API.Response): API.FormattedClusters => {
  return formatClusters(response.clusters);
};

export const getVacancies = async (urls: string[]) => {
  const chunk_size = 50;
  const chunked_urls = chunk(urls, chunk_size);

  console.log("количество чанков:", chunked_urls.length);

  const vacancies: API.Vacancy[] = [];

  for (const chunk of chunked_urls) {
    vacancies.push(...(await getVacanciesFromURLs(chunk)));
  }

  return vacancies;
};

export const getFullVacancies = async (
  urls: string[]
): Promise<API.FullVacancy[]> => {
  const chunked_urls = chunk(urls, 100);
  const full_vacancies: API.FullVacancy[] = [];

  console.log("количество чанков:", chunked_urls.length);

  let i = 0;
  for (const chunk of chunked_urls) {
    console.log(i);
    full_vacancies.push(...(await getFullVacanciesFromURLs(chunk)));
    i++;

    // if (i % 5 == 0) {
    //   await sleep(1000);
    // }
  }
  return full_vacancies;
};

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

const getPaginatableVacancies = async (
  parse_items: API.ParseItem[]
): Promise<string[]> => {
  const urls = parse_items.map(async (item) => {
    const url: string = item.url;
    const found: number = (await getVacanciesInfo(url)).found;
    const pages: number = Math.ceil(found / 100);
    return paginateLink(url, pages);
  });

  return ([] as string[]).concat(...(await Promise.all(urls)));
};

/**
 * для разделения (ветвления) крупных кластеров на более чем 2000 элементов на
 * меньшие ветвления с суммарным количеством элементов ниже или равным 2000
 * @param cluster_items - кластеры вакансий
 */
export const branchVacanciesFromDeepCluster = async (
  cluster_items: API.ClusterItem[]
): Promise<API.ParseItem[]> => {
  const urls = cluster_items.map((item) => item.url);

  const clusters: Promise<API.Cluster[]>[] = urls.map((url) =>
    fetch(url, {
      headers: hh_headers,
    })
      .then((res) => res.json() as Promise<API.Response>)
      .then((res) => res.clusters)
  );

  const parse_items = ([] as API.ParseItem[]).concat(
    ...(await Promise.all(clusters)).map((clusters) => {
      const formatted_clusters = formatClusters(clusters);
      const urls: any[] = [];
      if (formatted_clusters.metro !== undefined) {
        formatted_clusters.metro.items.forEach((item) => {
          urls.push({
            count: item.count,
            url: item.url,
            name: item.metro_line?.area.name + " " + item.name,
          });
        });
      }
      return urls;
    })
  );

  return parse_items;
};

export const getVacanciesFromURLs = async (urls: string[]) => {
  const data: Promise<API.Response>[] = urls.map((url) =>
    fetch(url, {
      headers: hh_headers,
    }).then((res) => res.json())
  );

  // дождаться резолва промисов, получить их поля items
  const vacancies: API.Vacancy[] = ([] as API.Vacancy[]).concat(
    ...(await Promise.all(data)).map((page) => {
      return page.items;
    })
  );
  return vacancies;
};

export const getFullVacanciesFromURLs = async (
  urls: string[]
): Promise<API.FullVacancy[]> => {
  const data: Promise<API.FullVacancy>[] = urls.map((url) =>
    fetchCache(url, { headers: hh_headers })
  );

  const full_vacancies: API.FullVacancy[] = await Promise.all(data);

  return full_vacancies;
};
