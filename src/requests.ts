import { partition } from "lodash-es";
import fetch from "node-fetch";
import { existsSync, readFileSync } from "node:fs";
import { fetchCache } from "./fetch-cache.js";
import { formatClusters, queryToString } from "./format.js";
import { saveToFile } from "./save.js";
import { API } from "./types/api/module";

const hh_headers = {
  "User-Agent": "labor-market-analyzer (vadim.kuz02@gmail.com)",
};

export const getVacanciesInfo = async (
  raw_url: string
): Promise<API.Response> => {
  const url = raw_url.replace(/per_page=(\d+)?/, "per_page=0");

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

const buildQueryURL = (raw_query: API.Query) => {
  const query = queryToString(raw_query);

  return "https://api.hh.ru/vacancies?" + query;
};

export const getVacancies = async (text: string) => {
  if (existsSync("kek.json")) {
    const file: string = readFileSync("./kek.json", { encoding: "utf-8" });

    console.log("KEK")

    return JSON.parse(file) as API.Vacancy[];
  }

  const raw_query: API.Query = {
    text: text,
    per_page: 100,
    page: 1,
    order_by: "salary_desc",
    no_magic: true,
    clusters: true,
    only_with_salary: false,
    area: 113,
    specialization: "1",
    industry: "7",
  };

  const url: string = buildQueryURL(raw_query);

  const info: API.Response = await getVacanciesInfo(url);

  const urls: string[] = Array.from(
    Array(info.pages).fill(url),
    (url: string, page: number) => url.replace(/&page=(\d+)?/, `&page=${page}`)
  );

  const response: API.Response = await fetch(
    encodeURI(
      buildQueryURL({
        ...raw_query,
        per_page: 0,
      })
    ),
    {
      headers: hh_headers,
    }
  ).then((res) => res.json());

  console.log("kek:", response.found);

  if (response.found > 2000) {
    const formatted_clusters: API.FormattedClusters = formatClusters(
      response.clusters
    );

    const [small_clusters, big_clusters] = partition(
      formatted_clusters.area.items,
      (cluster) => cluster.count <= 2000
    );

    const parse_items = await branchVacanciesFromDeepCluster(big_clusters);

    const [simple_parse_items, paginatable_parse_items] = partition(
      parse_items
        .concat(
          small_clusters.map((item) => ({
            count: item.count,
            url: item.url,
            name: item.name,
          }))
        )
        .sort((a, b) => b.count - a.count),
      (parse_item) => parse_item.count <= 100
    );

    const simple_urls: string[] = simple_parse_items.map((item) =>
      item.url
        .replace(/per_page=(\d+)?/, "per_page=100")
        .replace("clusters=true", "clusters=false")
    );

    const paginated_urls: string[] = await getPaginatableVacancies(
      paginatable_parse_items
    );

    // дождаться резолва промисов, получить их поля items
    const vacancies: API.Vacancy[] = await getVacanciesFromURLs(
      simple_urls.concat(paginated_urls)
    );

    console.log("KEK", vacancies.length);

    return vacancies;
  }

  return [] as API.Vacancy[];
};

const paginateLink = (link: string, pages: number): string[] => {
  const url = new URL(link);

  url.searchParams.set("page", "1");

  const urls: string[] = Array.from(
    Array(pages).fill(url.toString()),
    (url: string, page: number) =>
      url
        .replace("clusters=true", "clusters=false")
        .replace(/per_page=(\d+)?/, "per_page=100")
        .replace(/&page=(\d+)?/, `&page=${page}`)
  );

  return urls;
};

const getPaginatableVacancies = async (parse_items: API.ParseItem[]) => {
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
          urls.push({ count: item.count, url: item.url, name: item.name });
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

export const getFullVacancies = async (
  urls: string[]
): Promise<API.FullVacancy[]> => {
  const data: Promise<API.FullVacancy>[] = urls.map((url) =>
    fetchCache(url, { headers: hh_headers })
  );

  const full_vacancies: API.FullVacancy[] = await Promise.all(data);

  return full_vacancies;
};
