import { partition } from "lodash-es";
import { buildQueryURL, formatClusters } from "./core/format.js";
import {
  branchVacanciesFromDeepCluster,
  getFullVacancies,
  getVacancies,
  getVacanciesInfo
} from "./core/requests.js";
import { saveToFile } from "./utils/save.js";
import { getArea } from "./utils/suggest.js";
import { API } from "./types/api/module.js";
import { paginateClusters } from "./utils";

(async (text: string) => {
  const area = await getArea("Россия");

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

  const clusters: API.FormattedClusters = formatClusters(response.clusters);

  // console.log("анализ кластеров", response.found);
  // analyzeClusters(clusters);

  const [small_area_clusters, big_area_clusters] = partition(
    clusters.area.items,
    (cluster) => cluster.count <= 2000
  );

  const branched_big_cluster = await branchVacanciesFromDeepCluster(
    big_area_clusters
  );

  const paginated_urls_from_big_clusters = paginateClusters(
    branched_big_cluster
  );

  const paginated_urls_from_small_clusters = paginateClusters(
    small_area_clusters
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
