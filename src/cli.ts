import { Command } from "commander";
import { execSync } from "child_process";
import chalk from "chalk";
// import Suggest from "./suggest";

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
    // const area = await Suggest.area(cli.area, cli.language);

    console.log(text, cli.opts());
    // await search({
    //   text: text,
    //   area: area,
    //   limit: cli.limit,
    //   cluster: cli.cluster ?? cli.all ?? false,
    // });

    if (cli.opts().all) {
      setTimeout(() => {
        console.log(ctx.yellow("\n>"), "node cli.js get-full");
        execSync("node cli.js get-full", { stdio: "inherit" });

        console.log(ctx.yellow("\n>"), "node cli.js prepare");
        execSync("node cli.js prepare", { stdio: "inherit" });

        console.log(ctx.yellow("\n>"), "node cli.js analyze");
        execSync("node cli.js analyze", { stdio: "inherit" });
      }, 1000);
    }
  });

cli
  .command("get-full")
  .description("получает полное представление вакансий")
  .action(() => {
    // io.getFullVacancies(cli.limit);
  });

cli
  .command("prepare")
  .description("подготовить полные вакансии, очистить их от ненужных полей")
  .action(() => {
    // io.prepare();
  });

cli
  .command("analyze")
  .description("проанализировать полученные данные")
  .action(() => {
    // io.analyze();
  });

cli.parse(process.argv);

export default cli;
