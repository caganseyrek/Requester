import axios, { AxiosRequestConfig } from "axios";

interface EndpointProps {
  route: string;
  controller: string;
}

interface RequesterConfig {
  baseURL?: string;
  endpoint: EndpointProps;
  method: string;
  headers?: Record<string, string>;
  accessToken?: string;
  query?: string;
  payload: object;
  identifier?: string;
}

const BACKEND_URL = "enter your own url here WITH '/' at the end";
const TOKEN_ENDPOINT = "enter your own token endpoint here WITHOUT '/' at the beginning";

export class Requester {
  private baseURL: string;
  private tokenEndpoint: string = TOKEN_ENDPOINT;
  private endpoint: { route: string; controller: string };
  private method: string;
  private headers?: Record<string, string>;
  private accessToken?: string;
  private payload: object;
  private query?: string;
  private identifier?: string;

  constructor({ endpoint, method, headers, accessToken, payload, query, identifier }: RequesterConfig) {
    this.endpoint = endpoint;
    this.method = method;
    this.accessToken = accessToken;
    this.headers = {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...headers,
    };
    this.query = query;
    this.baseURL  = BACKEND_URL + (query && `?${this.query}`)
    this.payload = payload;
    this.identifier = identifier;
  }

  async send<TResponse>(): Promise<TResponse> {
    const requestUrl = this.baseURL + this.endpoint.route + "/" + this.endpoint.controller;
    const axiosConfig: AxiosRequestConfig = {
      url: requestUrl,
      method: this.method,
      headers: this.headers,
      data: this.payload,
    };
    try {
      const response = await axios<TResponse>(axiosConfig);
      return response.data as TResponse;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 && error.response.data.message === "Expired Token") {
          const newAccessToken = await this.refresh();
          if (newAccessToken) return this.send<TResponse>();
          return null as TResponse;
        }
        console.error(error.response?.data || error.message);
        throw new Error(error.response?.data || error.message);
      }
      console.error(error);
      throw new Error("An error ocurred");
    }
  }

  private async refresh(): Promise<string | null> {
    try {
      const requestUrl = this.baseURL + this.tokenEndpoint;
      const axiosConfig: AxiosRequestConfig = {
        url: requestUrl,
        method: methods.post,
        headers: { withCredentials: true },
        data: { id: this.identifier },
      };
      const newTokenResponse = await axios(axiosConfig);
      if (newTokenResponse.status === 200) {
        this.accessToken = newTokenResponse.data.accessToken;
        return newTokenResponse.data.accessToken;
      };
      return null;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export enum methods {
  get = "GET",
  post = "POST",
  patch = "PATCH",
  delete = "DELETE",
  //...
}

export enum routes {
  route = "route"
  //...
}

export enum controllers {
  action = "action"
  //...
}
