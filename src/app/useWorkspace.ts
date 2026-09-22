import { useCallback, useEffect, useRef, useState } from "react";
import type { Repository } from "../storage/repository";
import type { Snapshot, Space } from "../domain/types";
const empty: Snapshot = { journals: [], care: [] };
export function useWorkspace(repo: Repository, space: Space) {
  const generation = useRef(0);
  const current = useRef(space);
  current.current = space;
  const [state, setState] = useState({
    space,
    snapshot: empty,
    loading: true,
    error: null as string | null,
  });
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    setState((previous) =>
      previous.space === space
        ? { ...previous, error: null }
        : { space, snapshot: empty, loading: true, error: null },
    );
    try {
      const snapshot = await repo.read(space);
      if (version === generation.current && current.current === space)
        setState({ space, snapshot, loading: false, error: null });
    } catch (error) {
      if (version === generation.current && current.current === space)
        setState({
          space,
          snapshot: empty,
          loading: false,
          error: error instanceof Error ? error.message : "读取失败",
        });
    }
  }, [repo, space]);
  useEffect(() => {
    void refresh();
    return () => {
      generation.current++;
    };
  }, [refresh]);
  return {
    ...(state.space === space
      ? state
      : { space, snapshot: empty, loading: true, error: null }),
    refresh,
  };
}
