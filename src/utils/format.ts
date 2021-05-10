import { API } from "../types/api/module";

export const buildQueryURL = (raw_query: API.Query) => {
  const query = queryToString(raw_query);

  return "https://api.hh.ru/vacancies?" + query;
};

export const formatClusters = (
  clusters: API.Cluster[]
): API.FormattedClusters => convertArrayToObject(clusters, "id");

const queryToString = (query: API.Query): string => {
  const query_list: string[] = [];

  // объединить пары ключей и значений интерфейса знаком '='
  Object.entries(query).forEach(([key, value]) => {
    query_list.push([key, value].join("="));
  });

  // объединить эти пары пар знаком '&'
  return query_list.join("&");
};

const convertArrayToObject = (array: any[], key: string) => {
  const initialValue = {};
  return array.reduce((obj, item) => {
    return {
      ...obj,
      [item[key]]: item,
    };
  }, initialValue);
};
