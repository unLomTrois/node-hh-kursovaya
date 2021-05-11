import { API } from "../types/api/module";
import { saveToFile } from "../utils";

export const analyzeClusters = (clusters: API.FormattedClusters) => {
  saveToFile(clusters.area, "./data/clusters", "area.json");
  saveToFile(clusters.salary, "./data/clusters", "salary.json");
  saveToFile(clusters.sub_industry, "./data/clusters", "sub_industry.json");
  // saveToFile(clusters.industry, "./data/clusters", "industry.json");
  saveToFile(clusters.employment, "./data/clusters", "employment.json");
  saveToFile(clusters.experience, "./data/clusters", "experience.json");
  saveToFile(clusters.schedule, "./data/clusters", "schedule.json");
};

export const analyze = (
  vacancies: API.PreparedVacancy[],
  clusters: API.FormattedClusters
) => {
  // обработка вакансий

  // analyzeClusters(clusters)

  const analyzed_vacancies = analyzeVacancies(vacancies);

  saveToFile(analyzed_vacancies, "data", "rated_skills.json");
  // обработка кластеров

  // всего вакансий
  const found: number = vacancies.length;

  const analyzed_data = {
    analyzed_clusters: {
      found: found,
      salary_info: analyzeSalaryCluster(clusters.salary, found),
      experience_info: analyzeExperienceCluster(clusters.experience, found),
      employment_info: analyzeSimpleCluster(clusters.employment, found),
      schedule_info: analyzeSimpleCluster(clusters.schedule, found),
      industry_info: analyzeSimpleCluster(
        clusters?.industry ?? clusters.sub_industry,
        found
      ),
    },
    analyzed_vacancies: {
      has_test: {
        value: analyzed_vacancies.has_test,
        ratio: analyzed_vacancies.has_test / found,
      },
      test_required: {
        value: analyzed_vacancies.test_required,
        ratio: analyzed_vacancies.test_required / found,
        has_test_ratio:
          analyzed_vacancies.test_required / analyzed_vacancies.has_test,
      },
      accept_incomplete_resume: {
        value: analyzed_vacancies.accept_incomplete_resume,
        ratio: analyzed_vacancies.accept_incomplete_resume / found,
      },
      response_letter_required: {
        value: analyzed_vacancies.response_letter_required,
        ratio: analyzed_vacancies.response_letter_required / found,
      },
      key_skills: {
        vacancies_with_keyskills: {
          value:
            analyzed_vacancies.rated_skills.vacancies_with_keyskills.length,
          ratio:
            analyzed_vacancies.rated_skills.vacancies_with_keyskills.length /
            found,
        },
        top_ten: analyzed_vacancies.rated_skills.key_skills.slice(0, 10),
        full_list: analyzed_vacancies.rated_skills.key_skills,
      },
    },
  };

  saveToFile(analyzed_data, "data", "analyzed_data.json");

  return analyzed_data;
};

const analyzeSimpleCluster = (simple_cluster: API.Cluster, found: number) => {
  const groups: any[] = simple_cluster.items.map((item) => {
    return {
      name: item.name,
      count: item.count,
      ratio: parseFloat((item.count / found).toFixed(2)),
    };
  });

  return groups;
};

const analyzeSalaryCluster = (salary_cluster: API.Cluster, found: number) => {
  // количество вакансий с указанной зп
  const specified: number =
    salary_cluster.items.find((item) => item.name === "Указан")?.count ?? 0;

  const borders: any[] = [];

  salary_cluster.items.forEach((item, idx) => {
    if (item.name !== "Указан") {
      const next_item = salary_cluster.items[idx + 1];

      const interval_count =
        next_item !== undefined ? item.count - next_item.count : item.count;

      borders.push({
        from: parseFloat(item.name.split(" ")[1]), //полчаем число из фразы "от *число* руб."
        count: item.count,
        interval_count,
        ratio: parseFloat((item.count / found).toFixed(2)),
        ratio_to_specified: parseFloat((item.count / specified).toFixed(2)),
        ratio_of_interval_count_to_specified: parseFloat(
          (interval_count / specified).toFixed(2)
        ),
      });
    }
  });

  (() => {
    const next_item = borders[0];

    const count = specified - next_item.count;

    const interval_count = count;

    borders.unshift({
      from: 20000, //полчаем число из фразы "от *число* руб."
      count: count,
      interval_count,
      ratio: parseFloat((count / found).toFixed(2)),
      ratio_to_specified: parseFloat((count / specified).toFixed(2)),
      ratio_of_interval_count_to_specified: parseFloat(
        (interval_count / specified).toFixed(2)
      ),
    });
  })();

  const mean_salary = borders.reduce((acc, d) => {
    // console.log(acc, d.from, d.count);

    return (acc += d.from * d.count);
  }, 0);

  console.log(mean_salary);

  // результат
  return {
    specified: specified,
    mean_salary: mean_salary / found,
    mean_salary_to_specified: mean_salary / specified,
    specified_ratio: specified / found, // отношение всех вакансий к количеству с указнной зп
    borders,
  };
};

const analyzeExperienceCluster = (
  experience_cluster: API.Cluster,
  found: number
) => {
  const groups: any[] = [
    {
      from: 0,
      to: 1,
      count:
        experience_cluster.items.find((item) => item.name === "Нет опыта")
          ?.count ?? 0,
    },
    {
      from: 1,
      to: 3,
      count:
        experience_cluster.items.find(
          (item) => item.name === "От 1 года до 3 лет"
        )?.count ?? 0,
    },
    {
      from: 3,
      to: 6,
      count:
        experience_cluster.items.find((item) => item.name === "От 3 до 6 лет")
          ?.count ?? 0,
    },
    {
      from: 6,
      to: null,
      count:
        experience_cluster.items.find((item) => item.name === "Более 6 лет")
          ?.count ?? 0,
    },
  ];

  groups.forEach((exp) => {
    exp.ratio = parseFloat((exp.count / found).toFixed(2));
  });

  return groups;
};

const rateKeySkills = (prepared_vacancies: API.PreparedVacancy[]) => {
  const vacancies_with_keyskills = prepared_vacancies.filter(
    (vac) => vac.key_skills != undefined
  );

  console.log("vacancies_with_keyskills:", vacancies_with_keyskills.length);

  const key_skills = vacancies_with_keyskills.flatMap((vac) =>
    vac.key_skills?.map((key_list) => key_list.name)
  );

  const result: any = {};
  key_skills.forEach((skill) => {
    result[skill] = (result[skill] || 0) + 1;
  });

  const rated_skills = Object.entries<number>(result)
    .map((arr) => {
      return {
        name: arr[0],
        count: arr[1],
        ratio: parseFloat((arr[1] / prepared_vacancies.length).toFixed(3)),
      };
    })
    .filter((skill) => skill.ratio >= 0.01)
    .sort((skill_1, skill_2) =>
      skill_1.count < skill_2.count ? 1 : skill_2.count < skill_1.count ? -1 : 0
    );

  return {
    vacancies_with_keyskills,
    key_skills: rated_skills,
  };
};

const analyzeVacancies = (prepared_vacancies: API.PreparedVacancy[]) => {
  console.log("prepared:", prepared_vacancies.length);

  const has_test: number = prepared_vacancies.reduce(
    (acc, vac) => (acc += vac.has_test ? 1 : 0),
    0
  );

  const test_required: number = prepared_vacancies.reduce(
    (acc, vac) => (acc += vac.test?.required ? 1 : 0),
    0
  );

  const response_letter_required: number = prepared_vacancies.reduce(
    (acc, vac) => (acc += vac.response_letter_required ? 1 : 0),
    0
  );

  const accept_incomplete_resume: number = prepared_vacancies.reduce(
    (acc, vac) => (acc += vac.accept_incomplete_resumes ? 1 : 0),
    0
  );

  const rated_skills = rateKeySkills(prepared_vacancies);

  return {
    rated_skills,
    has_test,
    test_required,
    response_letter_required,
    accept_incomplete_resume,
  };
};
