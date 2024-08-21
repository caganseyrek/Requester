import axios, { AxiosRequestConfig } from "axios";

interface endpointProps {
  route: string;
  controller: string;
}

interface RequesterConfig {
  baseURL?: string;
  endpoint: endpointProps;
  method: string;
  headers?: Record<string, string>;
  accessToken?: string;
  identifier?: string;
  payload: object;
}

const BACKEND_URL = "enter your own url here with '/' at the end";
const TOKEN_ENDPOINT = "enter your own token endpoint here without '/' at the beginning";

export class Requester {
  private baseURL: string = BACKEND_URL;
  private tokenEndpoint: string = TOKEN_ENDPOINT;
  private endpoint: { route: string; controller: string };
  private method: string;
  private headers?: Record<string, string>;
  private accessToken?: string;
  private payload: object;
  private identifier?: string;

  constructor({ endpoint, method, headers, accessToken, payload, identifier }: RequesterConfig) {
    this.endpoint = endpoint;
    this.method = method;
    this.accessToken = accessToken;
    this.headers = {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...headers,
    };
    this.payload = payload;
    this.identifier = identifier;
  }

  async send<T>(): Promise<T> {
    const requestUrl = this.baseURL + this.endpoint.route + "/" + this.endpoint.controller;
    const axiosConfig: AxiosRequestConfig = {
      url: requestUrl,
      method: this.method,
      headers: this.headers,
      data: this.payload,
    };
    try {
      const response = await axios<T>(axiosConfig);
      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 && error.response.data.message === "Expired Token") {
          const getNewAccessToken = await this.refresh();
          if (getNewAccessToken) {
            this.headers = { ...this.headers, Authorization: `Bearer ${getNewAccessToken}` };
            return this.send<T>();
          }
        }
        console.error(error.response?.data || error.message);
        throw new Error(error.response?.data || error.message);
      }
      console.error(error);
      throw new Error("An error ocurred");
    }
  }

  private async refresh(): Promise<string> {
    try {
      const requestUrl = this.baseURL + this.tokenEndpoint;
      const axiosConfig: AxiosRequestConfig = {
        url: requestUrl,
        method: methods.post,
        headers: { withCredentials: true },
        data: { id: this.identifier },
      };
      const response = await axios(axiosConfig);
      if (response.status === 200) {
        return response.data.accessToken;
      };
      return "";
    } catch (error) {
      console.error(error);
      return "";
    }
  }
}

export enum methods {
  get = "GET",
  post = "POST",
  patch = "PATCH",
  delete = "DELETE",
}

export enum routes {
  route = "route"
}

export enum controllers {
  action = "action"
}
