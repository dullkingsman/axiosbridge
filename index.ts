import _axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosStatic,
  CreateAxiosDefaults,
} from "axios";
import { none as None, Option, some as Some } from "fp-ts/Option";
import { Result } from "ts-results/esm";
import {
  cleanableExec,
  CleanableExecOnCleanConfig,
  cleanableSafeAsyncExec,
  CleanableSafeAsyncExecHandlers,
  convertPromiseToResult,
  execSafeAsync,
  processAbortController,
  PromiseToResultConverterConfig,
  SafeAsyncExecHandlers,
} from "./utils";
import {
  DEFAULT_CONNECTION_TIME_OUT,
  DEFAULT_REQUEST_TIME_OUT,
} from "./constants";

/**
 * A wrapper for an axios instance that
 * converts the returned Promises in to
 * Results when a request is made.
 */
export class Bridge {
  /**
   * The axios default exported object.
   */
  static axios_static: AxiosStatic = _axios;

  /**
   * Main axios instance to be used for all requests
   */
  axios_instance: AxiosInstance;

  /**
   * Time before giving up on server
   * discovery.
   */
  connection_timeout: number = DEFAULT_CONNECTION_TIME_OUT;

  /**
   * Creates a new axios instance with the provided
   * configurations and default request timeout. And
   * it sets up response interceptors to make sure it
   * always rejects if the response is a RESTful error
   * (Status Code `400` and `above`).
   * @param config The axios create defaults.
   * @param axios The axios default exported object.
   */
  constructor(config?: CreateAxiosDefaults, axios?: AxiosStatic) {
    if (axios) Bridge.axios_static = axios;

    this.axios_instance = Bridge.axios_static.create({
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
        return Promise.reject(error);
      },
    );
  }

  /**
   * Transforms an error in to another.
   * Forms a js Error by default.
   * @param err The incoming error.
   */
  private static _errorConstructor = (err?: any) =>
    (err?.message || err?.name || err?.code
      ? new Error(err.message ?? err.name ?? err?.code)
      : new Error("UNKNOWN_ERROR")) as Error | any;

  /**
   * Sets the error constructor.
   * @param errorConstructor New error constructor
   */
  static setErrorConstructor<E>(errorConstructor: (err?: any) => E) {
    this._errorConstructor = errorConstructor;
  }

  /**
   * Processes the request call and converts the resulting
   * promise to a Result.
   * @param _function The function to be processed
   * @param connection_timeout Time before giving up on
   * server discovery.
   * @private
   */
  private static async process<T, E>(
    _function: (internalConfig?: AxiosRequestConfig) => Promise<AxiosResponse>,
    connection_timeout: number,
  ): Promise<Result<Option<T>, E>> {
    const controller = new AbortController();

    const abortTimeoutId = setTimeout(() => {
      controller.abort();
    }, connection_timeout);

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

  /**
   * Constructs a new type of error from the incoming error
   * and cleans a request abort appointment if there is any.
   * @param err The error the was thrown
   * @param abortTimeoutId The id of the timeout for
   * the request abort appointment.
   * @private
   */
  private static processError<E>(err: any, abortTimeoutId?: number): E {
    if (abortTimeoutId) clearTimeout(abortTimeoutId);

    if (Bridge.axios_static.isAxiosError(err)) {
      const apiError =
        err.response?.data?.error ?? err.response?.data ?? err.request ?? err;

      return this._errorConstructor({
        ...(apiError ? apiError : {}),
        status: err.response?.status,
      });
    } else return this._errorConstructor(err);
  }

  /**
   * Converts the nullable data response to an Option,
   * and cleans a request abort appointment if there is any.
   * @param res The incoming data
   * @param abortTimeoutId The id of the timeout for
   * the request abort appointment.
   * @private
   */
  private static extractDataOrNone<T>(
    res: AxiosResponse,
    abortTimeoutId?: number,
  ): Option<T> {
    if (abortTimeoutId) clearTimeout(abortTimeoutId);

    if (res.data && res.status !== 204) return Some(res.data);

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
      this.connection_timeout,
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
    }, this.connection_timeout);
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
      this.connection_timeout,
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
      this.connection_timeout,
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
      this.connection_timeout,
    );
  }
}

export {
  CleanableExecOnCleanConfig,
  SafeAsyncExecHandlers,
  PromiseToResultConverterConfig,
  CleanableSafeAsyncExecHandlers,
};

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
