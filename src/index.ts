import fetch from "node-fetch";
import { queryToString } from "./format.js";
import { API } from "./types/api/module";

const hh_headers = {
  "User-Agent": "labor-market-analyzer (vadim.kuz02@gmail.com)",
};

// получить число вакансий по utl
const getFoundVacanciesNumber = async (raw_url: string): Promise<number> => {
  // изменить per_page=*число* в url на per_page=0,
  // чтобы не получать ненужные данные
  const url = raw_url.replace(/per_page=(\d+)?/, "per_page=0");

  const data = await fetch(encodeURI(url), {
    headers: hh_headers,
  }).then((res) => res.json());

  return data.found;
};

const getVacancies = async (raw_query: API.Query, limit = 2000) => {
  const query = queryToString(raw_query);

  const url = "https://api.hh.ru/vacancies?" + query;

  const found: number = await getFoundVacanciesNumber(url);

  // получаем количество элементов на страницу
  const per_page: number = raw_query.per_page ?? 100;

  // вычисляем количество требуемых страниц
  const pages: number = Math.ceil((found <= limit ? found : limit) / per_page);

  const urls: string[] = Array.from(
    Array(pages).fill(url),
    (url: string, page: number) => url.replace(/&page=(\d+)?/, `&page=${page}`)
  );

  // сделать серию ассинхронных запросов, получить promise представления json
  const data: Promise<API.Vacancy>[] = urls.map((url) =>
    fetch(encodeURI(url), { headers: hh_headers }).then((res) =>
      res.json()
    )
  );

  // дождаться резолва промисов, получить их поля items
  const vacancies: API.Vacancy[] = [].concat(
    ...(await Promise.all(data)).map((page) => page.items)
  );

  return vacancies;
};

getVacancies({
  text: "react",
  per_page: 100,
  page: 1,
  order_by: "salary_desc",
  no_magic: true,
}).then((data) => {
  console.log(JSON.stringify(data, undefined, 2));
});
