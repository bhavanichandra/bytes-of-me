---
title: "Effortless Local Development with a Proxy Service"
tags: [software-development, proxy-server]
date: 2024-09-26
description: "Effortlessly set up a local development proxy service for APIs using Node, Express, and Docker with this comprehensive guide"
draft: false
---


## Introduction

Today, I tried to use an API that I don't have access to, and when I tested it in my Angular app, I got a CORS error. I wondered what to do next. Since I don't have access to the API, the only option is to ask the developer to add `localhost:4200` to the allowed list.

I searched online for a solution, then I remembered that I can make calls to the API from Postman. So, I decided to create a proxy service to pass through the calls from my Angular app to the actual API. This proxy is only used for local development, so there's no need to worry much about security aspects.

This blog shows a simple pass-through service which accepts UI requests and in turn call the target API to get the result back to the UI.

## Implementation

To implement this proxy service, there are few prerequisites:

* Node and Express
    
* `http-proxy-middleware` Express Middleware
    
* Dockerfile → Which I can use to run the proxy service locally within minutes
    

The below image shows a simple snippet of the proxy service using `http-proxy-middleware` library.

```javascript
app.use('/api', createProxyMiddleware({
    target: process.env.API_TARGET_URL,
    changeOrigin: true,
    logger: logger,
    secure: false,
    pathRewrite: {
        '^/api': ''
    }
}))
```

There are two main things from above image

1. Target URL: The URL to which the API calls will be passed through
    
2. Path Rewrite: Rewrite the `/api` to empty and pass the rest as usual.
    

I’m using `watson` library is used for logging, the log is verbose, and has all the required information.

### Dockerfile

```dockerfile
FROM node:22-alpine3.20

ARG API_TARGET_URL
ARG API_PORT=8083

ENV API_TARGET_URL=${API_TARGET_URL}
ENV API_PORT=${API_PORT}


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 

COPY ./src/ .

EXPOSE ${API_PORT}

CMD [ "node", "app.js" ]
```

This Dockerfile creates the `api-proxy` image and takes two build arguments:

* **API\_TARGET\_URL**: The API URL you want to use as the target. This is base url of your API
    
* **API\_PORT**: The port on which to run this `api-proxy` on.
    

### Usage:

To use this proxy service, you can pull the Docker image using this command:

```bash
docker pull bhavanichandra9/api-proxy
```

To run the service, use the following command:

```bash
docker run -e API_PORT='8084' -e API_TARGET_URL='https://jsonplaceholder.typicode.com' -p 8084:8084 bhavanichandra9/api-proxy:1.0.0
```

Another way to use this is to clone the GitHub repository, build the image, and use it as shown below:

You can check out this project on GitHub at this link: [https://github.com/bhavanichandra/api-proxy](https://github.com/bhavanichandra/api-proxy)

Clone the repository and configure your Docker. Use the following command to build the image:

```bash
docker build --build-arg API_TARGET_URL=https://jsonplaceholder.typicode.com --build-arg API_PORT=9093 -t api-local-proxy .
```

This will create a Docker image. Use the `docker run` command to expose the port used during the image build.

### Usage Example:

To demonstrate this proxy service, I used it with a simple test API from jsonplaceholder.typicode.com. This placeholder API has endpoints for `users`, `posts`, and more. Visit [https://jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com) for more details.

I have used the docker image published to the docker hub and tried running the below command

`docker run -e API_PORT='8084' -e API_TARGET_URL='`[`https://jsonplaceholder.typicode.com`](https://jsonplaceholder.typicode.com)`' -p 8084:8084 bhavanichandra9/api-proxy:1.0.0`

I exposed port 8084 in the container and forwarded it to port 8084 on my local system. This allows me to access APIs from [`https://jsonplaceholder.typicode.com`](https://jsonplaceholder.typicode.com) at `http://localhost:8084/api`.

Using Postman or curl, I can get responses from the jsonplaceholder API.

```bash
curl --location 'http://localhost:8084/api/users'
```

The below are the logs from the docker container:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1727300928422/d6f6a105-2a8e-4367-bb98-dbdbce9d7b33.png)

As you can see above, the path `/api/users` is rewritten to call the actual API with just `/users`.

Feel free to customize the api-proxy on GitHub.

Thanks for taking time to read the blog.
