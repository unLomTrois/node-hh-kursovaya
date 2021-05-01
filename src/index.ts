import { partition } from "lodash-es";
import { setTimeout } from "node:timers";
import { analyzeClusters } from "./analyze.js";
import {
  getVacanciesInfo,
  buildQueryURL,
  getClusters,
  paginateLink,
  branchVacanciesFromDeepCluster,
  getFullVacancies,
  getVacancies,
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

  console.log("спаршенно полных вакансий:", full_vacancies.length);
})("разработчик");
