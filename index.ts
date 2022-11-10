import {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from "axios";
import { none as None, Option, some as Some } from "fp-ts/Option";
import { Result } from "ts-results";
import {
  cleanableExec,
  cleanableSafeAsyncExec,
  convertPromiseToResult,
  execSafeAsync,
} from "./utils";
import {
  DEFAULT_CONNECTION_TIME_OUT,
  DEFAULT_REQUEST_TIME_OUT,
} from "./constants";

const axios = require("axios");

/**
 * A wrapper for an axios instance that
 * converts the returned Promises in to
 * Results when a request is made.
 */
export class Bridge {
  /**
   * Main axios instance to be used for all requests
   */
  axios_instance: AxiosInstance;

  constructor(
    createFunction: (config?: CreateAxiosDefaults) => AxiosInstance,
    config?: CreateAxiosDefaults,
  ) {
    const create = createFunction ?? axios.create;

    this.axios_instance = create({
      timeout: DEFAULT_REQUEST_TIME_OUT,
      ...(config ? config : {}),
    });

    // make sure that axios rejects if the response
    // status code is above 400
    this.axios_instance.interceptors.response.use(
      function (response) {
        return response;
      },
      function (error) {
        Promise.reject(error);
      },
    );
  }

  private static _errorConstructor = (err?: any) =>
    (err?.message || err?.name || err?.code
      ? new Error(err.message ?? err.name ?? err?.code)
      : new Error("UNKNOWN_ERROR")) as Error | any;

  static setErrorConstructor<E>(errorConstructor: (err?: any) => E) {
    this._errorConstructor = errorConstructor;
  }

  private static async process<T, E>(
    _function: (internalConfig?: AxiosRequestConfig) => Promise<AxiosResponse>,
  ): Promise<Result<Option<T>, E>> {
    const controller = new AbortController();

    const abortTimeoutId = setTimeout(() => {
      controller.abort();
    }, DEFAULT_CONNECTION_TIME_OUT);

    return convertPromiseToResult<Option<T>, E>(
      async () => {
        return Bridge.extractDataOrNone<T>(
          await _function({ signal: controller.signal }),
          abortTimeoutId as unknown as number,
        );
      },
      (err: any) =>
        Bridge.processError<E>(err, abortTimeoutId as unknown as number),
      undefined,
      undefined,
      this._errorConstructor,
    );
  }

  private static processError<E>(err: any, abortTimeoutId?: number): E {
    if (abortTimeoutId) clearTimeout(abortTimeoutId);

    // @ts-ignore
    if (axios.isAxiosError(err)) {
      const apiError = err.response?.data?.error ?? err.response?.data;

      return this._errorConstructor(apiError);
    } else return this._errorConstructor(err);
  }

  private static extractDataOrNone<T>(
    res: AxiosResponse,
    abortTimeoutId?: number,
  ): Option<T> {
    if (abortTimeoutId) clearTimeout(abortTimeoutId);

    if (res.data && (res.status === 201 || res.status === 200))
      return Some(!res.data.data ? res.data : res.data.data);

    return None;
  }

  /**
   * Request fetch
   */
  async get<T, E>(
    route: string,
    config?: AxiosRequestConfig,
  ): Promise<Result<Option<T>, E>> {
    return Bridge.process(
      async (internalConfig?: AxiosRequestConfig) =>
        await this.axios_instance.get(`${route}`, {
          ...internalConfig,
          ...config,
        }),
    );
  }

  /**
   * Request create
   */
  async post<T, H, E>(
    route: string,
    data: T,
    config?: AxiosRequestConfig,
  ): Promise<Result<Option<H>, E>> {
    return Bridge.process(async (internalConfig?: AxiosRequestConfig) => {
      return await this.axios_instance.post(`${route}`, data, {
        ...internalConfig,
        ...config,
      });
    });
  }

  /**
   * Request patch
   */
  async patch<T, H, E>(
    route: string,
    data?: T,
    config?: AxiosRequestConfig,
  ): Promise<Result<Option<H>, E>> {
    return Bridge.process(
      async (internalConfig?: AxiosRequestConfig) =>
        await this.axios_instance.patch(`${route}`, data, {
          ...internalConfig,
          ...config,
        }),
    );
  }

  /**
   * Request update
   */
  async put<T, H, E>(
    route: string,
    data?: T,
    config?: AxiosRequestConfig,
  ): Promise<Result<Option<H>, E>> {
    return Bridge.process(
      async (internalConfig?: AxiosRequestConfig) =>
        await this.axios_instance.put(`${route}`, data, {
          ...internalConfig,
          ...config,
        }),
    );
  }

  /**
   * Request delete
   */
  async delete<T, E>(
    route: string,
    config?: AxiosRequestConfig,
  ): Promise<Result<Option<T>, E>> {
    return Bridge.process(
      async (internalConfig?: AxiosRequestConfig) =>
        await this.axios_instance.delete(`${route}`, {
          ...internalConfig,
          ...config,
        }),
    );
  }
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

export default {
  Bridge,
  convertPromiseToResult,
  processAbortController,
  cleanableSafeAsyncExec,
  execSafeAsync,
  cleanableExec,
  DEFAULT_REQUEST_TIME_OUT,
  DEFAULT_CONNECTION_TIME_OUT,
};
