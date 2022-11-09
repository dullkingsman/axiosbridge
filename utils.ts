import { Err, Ok, Result } from "ts-results";
import { Option, match } from "fp-ts/Option";
import { pipe } from "fp-ts/function";

/**
 * Runs the provided function and if it throws
 * an error it catches and logs then it converts
 * Promise to a Result before returning it.
 */
export function convertPromiseToResult<T, E>(
  _function: (...args: any) => Promise<T>,
  onReject?: (err: any) => E,
  onFulfill: (result: T) => T = (result: T) => result,
  config: { log: boolean } = { log: false },
  errorConstructor?: <E>(err?: any) => E,
): Promise<Result<T, E>> {
  return _function()
    .then((result) => {
      return Ok(onFulfill(result));
    })
    .catch((err) => {
      const error = !onReject
        ? !errorConstructor
          ? err
          : errorConstructor(err)
        : onReject(errorConstructor ? errorConstructor(err) : err);

      if (config.log) console.error(error);
      return Err(error);
    });
}

/**
 * Runs an async function that will always resolve to
 * a Result and runs the proper handler with the value.
 */
export async function execSafeAsync<T, E, F>(
  _function: () => Promise<Result<Option<T>, E>>,
  handlers: {
    onFulfilled: (value: T) => void;
    onError?: (error: E) => void;
    onNone?: () => void;
    _finally?: () => F | void;
  },
): Promise<F | void> {
  const result = await _function();

  if (result.ok)
    pipe(
      result.val,
      match(
        !handlers.onNone
          ? () => {
              return;
            }
          : handlers.onNone,
        handlers.onFulfilled,
      ),
    );
  else if (handlers.onError) handlers.onError(result.val as E);

  if (handlers._finally) return handlers._finally();
}

/**
 * Delays the execution of a function
 * by the provided delay. The delay is
 * `0` by default.
 *
 * <b>N.B.</b> This is to be used for
 * calling asynchronous tasks in `useEffect`s
 * that execute on mount.
 */
export function cleanableExec(
  _function: () => void,
  delay = 0,
  onClean?: { handler: () => void; cleanAfter?: boolean },
) {
  const id = setTimeout(function () {
    _function();
  }, delay);

  return () => {
    if (onClean?.cleanAfter) {
      clearTimeout(id);
      onClean.handler();
    } else {
      onClean?.handler?.();
      clearTimeout(id);
    }
  };
}

/**
 * Wraps cleanable [execSafeAsync] in a {cleanableExec}
 */
export function cleanableSafeAsyncExec<T, E, F>(
  _function: () => Promise<Result<Option<T>, E>>,
  handlers: {
    onFulfilled: (value: T) => void;
    onError?: (error: E) => void;
    onNone?: () => void;
    _finally?: () => F | void;
    onClean?: { handler: () => void; cleanAfter?: boolean };
  },
  delay?: number,
) {
  return cleanableExec(
    () => void execSafeAsync(_function, handlers),
    delay,
    handlers.onClean,
  );
}
