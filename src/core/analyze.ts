import { saveToFile } from "../utils/save.js";
import { API } from "../types/api/module";

export const analyzeClusters = (clusters: API.FormattedClusters) => {
  saveToFile(clusters.area, "./data/clusters", "area.json");
  saveToFile(clusters.salary, "./data/clusters", "salary.json");
  saveToFile(
    clusters.sub_industry,
    "./data/clusters",
    "sub_industry.json"
  );
  // saveToFile(clusters.industry, "./data/clusters", "industry.json");
  saveToFile(clusters.employment, "./data/clusters", "employment.json");
  saveToFile(clusters.experience, "./data/clusters", "experience.json");
  saveToFile(clusters.schedule, "./data/clusters", "schedule.json");
};
