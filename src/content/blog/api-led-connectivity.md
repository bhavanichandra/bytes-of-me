---
title: "API Led Connectivity"
tags: [mulesoft, architecture]
date: 2022-01-01
description: "TODO: subtitle needed before publishing"
draft: true
---

## API Led Connectivity

MuleSoft introduced an approach to enterprise API integration called API Led Connectivity. It describes a way to divide APIs as a separation of concerns as per the business logic. 
It follows a layered architecture comprising three layers, such as:
  - **Experience**: This layer is an entry point to the applications through which Mobile or Web Apps can communicate.
  - **Process**: This layer will often contain the business logic, data transformations, and API orchestrations.
  - **System**: This layer will be the entry point to the external applications, APIs, or Systems such as Salesforce, Database, and other SaaS applications. 
 
## Business Use Case:

> To demonstrate the API-Led Connectivity, let us assume the below integration scenario and a layered architecture diagram.

Gary, an online eCommerce platform owner, currently manages all the service requests and incident reports manually, entering into various third-party systems. 
- The initial assessment shows that it was manageable, but as the business grows, the number of requests increases and the earlier management acts as a bottleneck to his business. 
- He recently bought a license from MuleSoft to streamline the incident management system.
- The systems Gary uses: are ServiceNow, Slack, Salesforce, Database, and Legacy System to store customer data.

## Solution:

To build a robust incident management system, let us architect an API-Led Connectivity system that seamlessly connects to the various applications.



![api-led-connectivity-systems.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1652041393356/KGghJD8OR.png align="left")

### Summary
- The SaaS Applications are Salesforce, ServiceNow, Slack, and the legacy system.
- For each SaaS application, we can create a System API, which is the first layer to be designed.
- As the old customers exist in the legacy system and new customers exist in Salesforce, so to retrieve the records, a process API can help to aggregate the records from both systems and have a single source of truth. Let's call it Customer's API.
- ServiceNow system exposes the necessary endpoints to create, update, and get the service requests from the system.
- Service Incident Process API will act as a pass-through for the ServiceNow System API. Such Process APIs also exist.
- Lastly, the Slack API connects via Notification API.
- Both the Customers API and Service Incident API connect via an Experience API that combines the data from both APIs.

### Orchestration

- A web page with a form sends an HTTP POST request on the form submit to the experience API.
- Experience API will call the Customer Incident API. First, the customer incident API calls the Customers API to get the customer data, then it will call the Service Incident API to create the Service Request.
- While this process is underway, another request is sent to Slack via Notification API to notify the concerned person asynchronously.
- The Customers API calls the legacy system and the Salesforce to get the customer data.
- The Service Incident API calls the ServiceNow System API, which will connect to the ServiceNow system and creates the Service Request.
- During this process, the Slack system will notify the respective person.