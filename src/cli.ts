import { Command } from "commander";
import { execSync } from "child_process";
import chalk from "chalk";
import { getArea, getFromLog } from "./utils";
import { API } from "./types/api/module";
import { getFull, prepare, search } from "./core/io.js";
import { analyze } from "./core/analyze";

const ctx = new chalk.Instance({ level: 1 });

const cli = new Command();

cli.name("node-hh-parser").version("1.0.0");

// инициализация полей (опций)
cli
  .option(
    "-A, --all",
    "выполнить все остальные комманды автоматически",
    "Россия"
  )
  .option(
    "-a, --area <area-name>",
    "название территории поиска или индекс",
    "Россия"
  )
  .option("-S, --silent", "не выводить информацию в консоль");

// инициализация команд (операций)
cli
  .command("search <text>")
  .description("поиск вакансий по полю text")
  .action(async (text: string) => {
    const area = await getArea(cli.opts().area);

    const raw_query: API.Query = {
      text: text,
      area: area,
      per_page: 100,
      page: 1,
      // order_by: "salary_desc",
      // no_magic: false,
      clusters: true,
      // only_with_salary: false,
      // specialization: "1",
      // industry: "7",
    };

    await search({ ...raw_query, text, area });

    if (cli.opts().all) {
      setTimeout(() => {
        console.log(ctx.yellow("\n>"), "yarn cli get-full");
        execSync("yarn cli get-full", { stdio: "inherit" });

        console.log(ctx.yellow("\n>"), "yarn cli analyze");
        execSync("yarn cli analyze", { stdio: "inherit" });
      }, 1000);
    }
  });

cli
  .command("get-full")
  .description("получает полное представление вакансий")
  .action(() => {
    const vacancies: API.Vacancy[] = getFromLog("data", "vacancies.json");
    
    getFull(vacancies);
  });

cli
  .command("prepare")
  .description("подготовить полные вакансии, очистить их от ненужных полей")
  .action(() => {
    const full_vacancies: API.FullVacancy[] = getFromLog("data", "full_vacancies.json");
    
    prepare(full_vacancies);
  });

cli
  .command("analyze")
  .description("проанализировать полученные данные")
  .action(() => {
    const prepared_vacancies: API.FullVacancy[] = getFromLog("data", "prepared_vacancies.json");
    const clusters: API.FormattedClusters = getFromLog("data", "clusters.json");

    analyze(prepared_vacancies, clusters);
  });

export default cli;
