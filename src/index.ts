import { chunk } from "lodash-es";
import { setTimeout } from "node:timers";
import { fetchCache } from "./fetch-cache.js";
import { getVacancies } from "./requests.js";
import { saveToFile } from "./save.js";
import { API } from "./types/api/module.js";

const short_vacancies = getVacancies("разработчик");

short_vacancies
  .then((data) => {
    return data.map((d) => d.url);
  })
  .then((urls) => {
    return urls.map(async (url) => {
      return await fetchCache(url);
    });
  })
  .then(async (fetches: Promise<any>[]) => {
    const full_vacancies: API.FullVacancy[] = ([] as API.FullVacancy[]).concat(
      ...(await Promise.all(fetches)
        .then((chunk) => {
          return chunk;
        })
        .catch((err) => {
          return err;
        }))
    );

    saveToFile(full_vacancies, "./build", "kek.json")
  });
