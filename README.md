# Requester

A custom and flexible HTTP requester that uses [Axios](https://axios-http.com/) and includes an automatic access token renewal function.

- This requester uses an access token as a value and a refresh token stored as a cookie.

## How does it work?

- The requester initializes an Axios instance first and passes the provided props to that Axios instance's config.
- There are two values you need to set before using the requester: **baseURL**, **tokenEndpoint**.

  ```typescript
  const BACKEND_URL = "enter your own url here with '/' at the end";
  const TOKEN_ENDPOINT =
    "enter your own token endpoint here without '/' at the beginning";

  export class Requester {
    private baseURL: string = BACKEND_URL;
    private tokenEndpoint: string = TOKEN_ENDPOINT;
    //...
  }
  ```

  - **baseURL**: This is the base URL of your backend server. It should end with "/". For example: `https://example.com/api/`.
  - **tokenEndpoint**: This is the endpoint where we send a request to get a new access token. It should NOT start with "/". For example, if you set this value to `getNewAccessToken`, the requester sends a request to `https://example.com/api/getNewAccessToken`.

- There are three required props: **method**, **endpoint** and **payload**.

  ```typescript
  export class Requester {
    //...
    private endpoint: { route: string; controller: string };
    private method: string;
    private payload: object;
    //...
  }
  ```

  - **method**: This value should be the request method (POST, GET, PATCH, etc.). This value can be selected from the methods enum present at the end of the file to ensure consistency.
  - **payload**: Payload is the data we will send to the backend server.
  - **endpoint**: The endpoint value has its own sub-values: **route** and **controller**. For instance, if our endpoint is `https://example.com/api/posts/getPosts`, the baseURL should be `https://example.com/api/`. Thus, the route can be thought of as **posts** and the controller as **getPosts**. These values should not contain "/". You can add these routes and controllers to the route and controller enums present at the end of the file to ensure consistency.

- If the response status is 401/Unauthorized and the response message is "Expired Token" (this condition can be customized), it sends another request to the token endpoint provided to get a new access token, includes the refresh token cookie with this request.
- If a new access token is received, it re-sends the original request with the new access token. If the refresh token is also expired and a new access token is not received, it throws an error.

## Dependencies

This requester requires [Axios](https://axios-http.com/) to function.

```bash
npm i axios
# or
pnpm add axios
```

## Setup

Several settings are required to make the requester work.

First, add your backend server URL and token endpoint as described above:

```typescript
// Entered url should have a "/" at the end
const BACKEND_URL = "https://example.com/api/";

/*
 * Entered url should NOT have a "/" at the beginning.
 * Backend url and token endpoint are merged in the code,
 * so the token endpoint will be https://api.example.com/getNewAccessToken
 */
const TOKEN_ENDPOINT = "getNewAccessToken";
```

You can add an identifier value for backend functions. By default, the requester includes a UserId prop, but this prop can be customized or renamed to suit your needs:

```typescript
export class Requester {
  private baseURL: string = BACKEND_URL;
  private tokenEndpoint: string = TOKEN_ENDPOINT;
  private endpoint: { route: string; controller: string };
  private method: string;
  private headers?: Record<string, string>;
  private accessToken?: string;
  private userId?: string; // You can customize or rename this to suit your needs
  private payload: object;
  //...
}
```

You can add custom data for the token renewal process. By default, the requester sends the UserId value mentioned above.

```typescript
private async refresh(): Promise<string> {
  try {
    const requestUrl = this.baseURL + this.tokenEndpoint;
    const axiosConfig: AxiosRequestConfig = {
      url: requestUrl,
      method: methods.post,
      headers: { withCredentials: true },
      data: { userId: this.userId }, // You can customize this part
    };
  //...
  }
}
```

To check if the access token is expired, you can add a custom condition for your server's response. By default, the condition is as follows:

```typescript
if (
  error.response?.status === 401 &&
  error.response.data.message === "Expired Token"
) {
  //...
}
```

You can add custom enums for methods, routes, and controllers:

```typescript
export enum methods {
  get = "GET",
  post = "POST",
  patch = "PATCH",
  delete = "DELETE",
  //...
}

export enum routes {
  route = "route",
  //...
}

export enum controllers {
  action = "action",
  //...
}
```

Lastly, you can add a custom error message in the `send` function:

```typescript
throw new Error("An error ocurred");
```

## Usage

First, initialize the requester class, then provide the required and optional props, and invoke the `send` function.

```typescript
function fetchSomeData(someData: object) {
  try {
    return new Requester({
      method: methods.post,
      userId: "123",
      endpoint: {
        route: routes.someRoute,
        controller: controllers.someController,
      },
      payload: someData,
    }).send<Custom>(); // You can add custom interfaces for responses here
  } catch (error) {
    console.error(error);
    throw new Error(error as string);
  }
}
```
