import { Err, isOk, Ok, Result } from "rustic";
import { Option, isNone } from "fp-ts/Option";

/**
 * Runs the provided function and if it throws
 * an error it catches and logs then it converts
 * Promise to a Result before returning it.
 * @param _function The function to be run
 * @param onReject Runs if the function throws an error
 * @param onFulfill Runs if the function completes successfully
 * @param config Configuration for the convertor
 * @param errorConstructor Transforms one type of error into another
 *
 */
export async function convertPromiseToResult<T, E>(
  _function: (...args: any) => Promise<T>,
  onReject?: (err: any) => E,
  onFulfill: (result: T) => T = (result: T) => result,
  config: PromiseToResultConverterConfig = { logErrors: false },
  errorConstructor?: <E>(err?: any) => E,
): Promise<Result<T, E>> {
  try {
    const result = await _function();
    return Ok(onFulfill(result));
  } catch (err) {
    const error = !onReject
      ? !errorConstructor
        ? err
        : errorConstructor(err)
      : onReject(err);

    if (config.logErrors) console.error(error);
    return Err(error as E);
  }
}

/**
 * Runs an async function that will always resolve to
 * a Result and runs the proper handler with the resulting
 * value.
 * @param _function The function to be run
 * @param handlers The handlers for the execution result
 */
export async function execSafeAsync<T, E, F>(
  _function: () => Promise<Result<Option<T>, E>>,
  handlers: SafeAsyncExecHandlers<T, E, F>,
): Promise<F | void> {
  const result = await _function();

  if (isOk(result)) {
    if (isNone(result.data)) {
      if (handlers.onNone) handlers.onNone();
    } else handlers.onFulfilled(result.data.value);
  } else if (handlers.onError) handlers.onError(result.data);

  if (handlers._finally) return handlers._finally();
}

/**
 * Delays the execution of a function
 * by the provided delay and returns a cleanup
 * function to clean the timeout later.
 * The delay is `0` by default.
 *
 * <b>N.B.</b> This is to be used for
 * calling asynchronous tasks in `useEffect`s
 * that execute on mount.
 * @param _function The function to be run
 * @param delay The delay after which the function is to be run
 * @param onClean Handler configuration for cleanup
 *
 */
export function cleanableExec(
  _function: () => void,
  delay = 0,
  onClean?: CleanableExecOnCleanConfig,
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
 * @param _function The function to be run
 * @param handlers The handlers for the execution result
 * @param delay The delay after which the function is to
 * be run
 */
export function cleanableSafeAsyncExec<T, E, F>(
  _function: () => Promise<Result<Option<T>, E>>,
  handlers: CleanableSafeAsyncExecHandlers<T, E, F>,
  delay?: number,
) {
  return cleanableExec(
    () => void execSafeAsync(_function, handlers),
    delay,
    handlers.onClean,
  );
}

/**
 * It aborts if an external controller is provided
 * and produces a new controller if not.
 */
export function processAbortController(controller?: AbortController) {
  if (controller && !controller?.signal.aborted) {
    controller.abort();
    return controller;
  }
  return new AbortController();
}

/***************************** Type Definitions *******************************/

/**
 * @typedef PromiseToResultConverterConfig
 */
export type PromiseToResultConverterConfig = {
  /**
   * Determines whether the converter logs
   * errors when the function being run
   * throws.
   */
  logErrors: boolean;
};

/**
 * @typedef SafeAsyncExecHandlers
 */
export type SafeAsyncExecHandlers<T, E, F> = {
  /**
   * Runs if the execution resolved without
   * errors, and it yields a non-empty value.
   */
  onFulfilled: (value: T) => void;
  /**
   * Runs if the execution fails.
   */
  onError?: (error: E) => void;
  /**
   * Runs if the execution is resolved without
   * errors, but it yields an empty value.
   */
  onNone?: () => void;
  /**
   * Runs after all other handlers without condition
   * if provided.
   */
  _finally?: () => F | void;
};

/**
 * @typedef CleanableExecOnCleanConfig
 */
export type CleanableExecOnCleanConfig = {
  /**
   * The function to be appended.
   */
  handler: () => void;
  /**
   * Determines whether to run the function after
   * the timeout clean up. If `true` it runs the
   * function after.
   */
  cleanAfter?: boolean;
};

/**
 * @typedef CleanableSafeAsyncExecHandlers
 */
export type CleanableSafeAsyncExecHandlers<T, E, F> = SafeAsyncExecHandlers<
  T,
  E,
  F
> & {
  /**
   * Appended to the cleaner function that is
   * returned from a cleanable execution.
   */
  onClean?: CleanableExecOnCleanConfig;
};
