import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "./api.js";

export function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(url, { params: JSON.parse(key) });
      setData(res.data);
      setError("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useForm(initial) {
  const [values, setValues] = useState(initial);
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));
  const bind = (name) => ({
    value: values[name] ?? "",
    onChange: (e) => set(name, e.target.value),
  });
  return { values, setValues, set, bind };
}
