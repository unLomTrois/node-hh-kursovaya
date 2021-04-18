import { existsSync, mkdirSync, writeFile } from "fs";
import { resolve } from "path";

export const saveToFile = (
  something_to_save: any,
  log_dir_path: string,
  filename_to_log: string,
  silent_mode: boolean = false
): void => {
  // если нет папки для сохранения логов, создать её
  if (!existsSync(log_dir_path)) {
    mkdirSync(log_dir_path);
  }

  // получить путь для сохранения
  const log_path = resolve(process.cwd(), log_dir_path, filename_to_log);

  // сохранить в лог
  writeFile(
    log_path,
    JSON.stringify(something_to_save, undefined, 2),
    (err) => {
      if (err) throw err;
      if (!silent_mode) {
        console.log("успешно сохранено в:", log_path);
        // const ctx = new chalk.Instance({ level: 1 });
        // console.log(ctx.yellow("успешно сохранено в:"), ctx.green(log_path));
      }
    }
  );
};
