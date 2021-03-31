export namespace API {
  type schedule = "fullDay" | "shift" | "flexible" | "remote" | "flyInFlyOut";

  type experience =
    | "noExperience"
    | "between1And3"
    | "between3And6"
    | "moreThan6";

  type employment = "full" | "part" | "project" | "volunteer" | "probation";

  type currency =
    | "AZN"
    | "BYR"
    | "EUR"
    | "GEL"
    | "KGS"
    | "KZT"
    | "RUR"
    | "UAH"
    | "USD"
    | "UZS";

  type order_by =
    | "publication_time"
    | "salary_desc"
    | "salary_asc"
    | "relevance"
    | "distance";

  type search_field = "name" | "company_name" | "description";

  export interface Query {
    no_magic?: boolean;
    area?: number;
    text?: string;
    schedule?: schedule;
    per_page?: number;
    page?: number;
    specialization?: string;
    experience?: experience;
    describe_arguments?: boolean;
    employment?: employment;
    industry?: string;
    salary?: number;
    currency?: currency;
    order_by?: order_by;
    search_field?: search_field;
    clusters?: boolean;
  }

  /// URL

  type baseURL = "https://api.hh.ru";

  type method = "/vacancies";

  export interface URL {
    baseURL: baseURL;
    method: method;
    query: Query;
  }

  /// ALIASES

  /**
   * @todo расписать точное представление вакансии
   * @link https://github.com/hhru/api/blob/master/docs/vacancies.md
   */

  /**
   * вакансия
   */
  export type Vacancy = any;
  export type FullVacancy = any;
  export type Clusters = any;

  export type PreparedVacancy = any;
  export type PreparedClusters = any;

  /// Analyzer

  export type AnalyzedData = any;

  export type analyzedInfo = any;

  export type SalaryCluster = any[];

  export type ExperienceCluster = any[];

  export type EmploymentCluster = any[];

  export type ScheduleCluster = any[];

  export type IndustryCluster = any[];

  export type SimpleCluster =
    | EmploymentCluster
    | ScheduleCluster
    | IndustryCluster;

  // IO

  export interface Request {
    text: string;
    area: number;
    limit: number;
    cluster: boolean;
  }

  /// Not used
  export interface Response {
    name: string;
    snippet: Snippet;
  }

  export interface Snippet {
    requirement: string | undefined | null;
    responsibility: string | undefined | null;
  }
}
