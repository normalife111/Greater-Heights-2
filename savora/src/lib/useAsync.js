import { useEffect, useState } from 'react';

/** Load data from a service function, exposing loading and error states. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null, isSample: false });

  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((res) => alive && setState({ loading: false, error: null, data: res.data, isSample: res.isSample }))
      .catch((error) => alive && setState({ loading: false, error, data: null, isSample: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
