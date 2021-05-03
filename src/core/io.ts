import { API } from "../types/api/module.js";
import { getFromLog, saveToFile } from "../utils/save.js";
import { buildQueryURL, formatClusters } from "./format.js";
import {
  getFullVacancies,
  getURLsFromClusters,
  getVacancies,
  getVacanciesInfo,
} from "./requests.js";

export const search = async (query: API.Query) => {
  const query_url = buildQueryURL({
    ...query,
    per_page: 0,
  })

  console.log(query_url)
  
  const response: API.Response = await getVacanciesInfo(
    query_url
  );

  const clusters: API.FormattedClusters = formatClusters(response.clusters);
  saveToFile(clusters, "data", "clusters.json");

  console.log("парсинг сокращённых вакансий");

  const urls = await getURLsFromClusters(clusters);
  const vacancies: API.Vacancy[] = await getVacancies(urls);

  console.log(vacancies.length)
  saveToFile(vacancies, "data", "vacancies.json");
};

export const getFull = async (vacancies: API.Vacancy[]) => {
  console.log("парсинг полных вакансий");

  const full_vacancies_urls = vacancies.map((vacancy) => vacancy.url);

  const full_vacancies = await getFullVacancies(full_vacancies_urls);

  saveToFile(full_vacancies, "data", "full_vacancies.json");

  console.log("спаршенно полных вакансий:", full_vacancies.length);
};

export const prepare = async (full_vacancies: API.FullVacancy[]) => {
  // нам важны поля key_skills
  const prepared_vacancies: API.PreparedVacancy[] = full_vacancies.map(
    (vac: API.FullVacancy) => {
      return {
        id: vac.id,
        key_skills: vac.key_skills,
        salary: vac.salary,
        response_letter_required: vac.response_letter_required,
        has_test: vac.has_test,
        test: vac.test,
        contacts: vac.contacts,
        allow_messages: vac.allow_messages,
        accept_incomplete_resumes: vac.accept_incomplete_resumes,
        accept_temporary: vac.accept_temporary,
      };
    }
  );

  saveToFile(prepared_vacancies, "data", "prepared_vacancies.json");

  console.log(prepared_vacancies.length)

};

