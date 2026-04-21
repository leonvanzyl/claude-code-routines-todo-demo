"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) {
      setValue(JSON.parse(stored));
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded] as const;
}
