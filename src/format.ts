import { API } from "./types/api/module";

export const queryToString = (query: API.Query): string => {
  const query_list: string[] = [];

  // объединить пары ключей и значений интерфейса знаком '='
  Object.entries(query).forEach(([key, value]) => {
    query_list.push([key, value].join("="));
  });

  // объединить эти пары пар знаком '&'
  return query_list.join("&");
};