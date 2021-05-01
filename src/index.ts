import { chunk, partition } from "lodash-es";
import { setTimeout } from "node:timers";
import { analyzeClusters } from "./analyze.js";
import { fetchCache } from "./fetch-cache.js";
import {
  getVacanciesInfo,
  buildQueryURL,
  getClusters,
  paginateLink,
  getVacanciesFromURLs,
  branchVacanciesFromDeepCluster,
  getFullVacanciesFromURLs,
} from "./requests.js";
import { saveToFile } from "./save.js";
import { API } from "./types/api/module.js";
import { promisify } from "util";
import Suggest from "./suggest.js";

const sleep = promisify(setTimeout);

const paginateSmallCluster = (parse_item: API.ParseItem): string[] => {
  const pages: number = Math.ceil(parse_item.count / 100);

  return paginateLink(parse_item.url, pages);
};

const getVacancies = async (urls: string[]) => {
  const chunk_size = 50;
  const chunked_urls = chunk(urls, chunk_size);

  console.log("количество чанков:", chunked_urls.length);

  const vacancies: API.Vacancy[] = [];

  for (const chunk of chunked_urls) {
    vacancies.push(...(await getVacanciesFromURLs(chunk)));
  }

  return vacancies;
};

const getFullVacancies = async (urls: string[]): Promise<API.FullVacancy[]> => {
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

(async (text: string) => {
  const area = await Suggest.area("Россия");

  const raw_query: API.Query = {
    text: text,
    per_page: 100,
    page: 1,
    order_by: "salary_desc",
    no_magic: true,
    clusters: true,
    only_with_salary: false,
    area: area,
    specialization: "1",
    industry: "7",
  };

  const response: API.Response = await getVacanciesInfo(
    buildQueryURL({
      ...raw_query,
      per_page: 0,
    })
  );

  console.log("Всего найдено:", response.found);

  console.log("парсинг кластеров");

  const clusters: API.FormattedClusters = getClusters(response);

  // console.log("анализ кластеров", response.found);
  // analyzeClusters(clusters);

  const [small_area_clusters, big_area_clusters] = partition(
    clusters.area.items,
    (cluster) => cluster.count <= 2000
  );

  saveToFile(big_area_clusters, "data", "big_area_clusters.json");
  saveToFile(small_area_clusters, "data", "small_area_clusters.json");

  const branched_big_cluster = await branchVacanciesFromDeepCluster(
    big_area_clusters
  );
  saveToFile(branched_big_cluster, "data", "branched_big_cluster.json");

  const paginated_urls_from_big_clusters = branched_big_cluster.flatMap(
    (cluster) => paginateSmallCluster(cluster)
  );

  const paginated_urls_from_small_clusters = small_area_clusters.flatMap(
    (cluster) => paginateSmallCluster(cluster)
  );

  console.log("парсинг сокращённых вакансий");
  const urls = paginated_urls_from_big_clusters.concat(
    paginated_urls_from_small_clusters
  );
  const vacancies: API.Vacancy[] = await getVacancies(urls);

  console.log("парсинг полных вакансий");

  const full_vacancies_urls = vacancies.map((vacancy) => vacancy.url);
  const full_vacancies = await getFullVacancies(full_vacancies_urls);

  saveToFile(full_vacancies, "data", "full_vacancies.json");
  saveToFile(full_vacancies, "data", "full_vacancies2.json", 0);

  console.log("спаршенно полных вакансий:", full_vacancies.length);
})("разработчик");

// short_vacancies
//   .then((data) => {
//     return data.map((d) => d.url);
//   })
//   .then((urls) => {
//     return urls.map(async (url) => {
//       return await fetchCache(url);
//     });
//   })
//   .then(async (fetches: Promise<any>[]) => {
//     const full_vacancies: API.FullVacancy[] = ([] as API.FullVacancy[]).concat(
//       ...(await Promise.all(fetches)
//         .then((chunk) => {
//           return chunk;
//         })
//         .catch((err) => {
//           return err;
//         }))
//     );

//     saveToFile(full_vacancies, "./build", "kek.json")
//   });
