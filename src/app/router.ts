import { useEffect, useState } from "react";
let dirty = false;
export function setDirty(value: boolean) {
  dirty = value;
}
export function allowLeave() {
  return !dirty || window.confirm("有尚未保存的内容，确定离开吗？");
}
export function navigate(path: string) {
  if (allowLeave()) {
    dirty = false;
    window.location.hash = path;
  }
}
export function useRoute() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || "/record");
  useEffect(() => {
    let previous = location.hash || "#/record";
    const change = () => {
      if (!allowLeave()) {
        history.replaceState(null, "", previous);
        return;
      }
      dirty = false;
      previous = location.hash;
      setRoute(previous.slice(1) || "/record");
      window.scrollTo?.(0, 0);
    };
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a[href^="#/"]') && dirty) {
        if (!allowLeave()) e.preventDefault();
        else dirty = false;
      }
    };
    window.addEventListener("hashchange", change);
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click);
    };
  }, []);
  return route;
}
