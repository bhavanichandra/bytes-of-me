---
title: "Brief Introduction to MuleSoft"
tags: [mulesoft]
date: 2022-01-01
description: "TODO: subtitle needed before publishing"
draft: true
---

## Brief Introduction to MuleSoft

# What is MuleSoft?

MuleSoft is a middleware, API Integration platform that allows enterprises to build robust integrations to alleviate their business needs and introduces various innovative solutions to expand the business. 
- As per my understanding, MuleSoft introduced an architectural paradigm that combines SOA, some aspects of the MVC pattern, and Enterprise Integration patterns called API-Led Connectivity. 
- It allows developers and architects to divide the APIs into specific layers such as Experience, Process, and System API.

>💡 What is Middleware? What is API?

## What is an API?

An API is like a blueprint/code that acts as an access point, a blueprint to all types of Systems. Assume that it is a black box that will execute and performs the specified function. 
- MuleSoft provides us with these APIs for developers to implement their business logic using MuleSoft. The advantage of API is that we do not need a deep dive into how a system works internally.
- In the MuleSoft world, they are called Connector / Modules / Operations. Each connector provides a specific function that it will perform on the system.

## What is Middleware?

A Middleware is software that acts as a software glue between systems by providing common ways to interact with systems via connectors. 
- Enterprise Service Bus (ESB) is the architecture that allows us with a set of rules and principles over a bus-like infrastructure. 
- The core concept of ESB is connecting to different systems by putting a communication bus or a software glue between them, decoupling various applications, and allowing them to communicate without any dependency. 
- MuleSoft developed a runtime engine called Mule, a flexible ESB solution that will act as the glue between systems by providing pluggable connectors.

![What is an ESB  MuleSoft.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1652036226043/TscNzHnfY.png align="center")

## Connectors:

MuleSoft provides various connectors such as

> There are many connectors by MuleSoft and other community developers. The below are few examples.

- **Core:** Few core connectors enable developers to build integrations in MuleSoft:
    - **Flow**: A flow is a top-level component in a Mule application. It is the starting point of any integration in Mule.
    - **Transformers:** Transforms and stores data.
    - **Async**: Enable asynchronous processing.
    - **For-Each:** The For Each scope is similar to a "for each" or "for loop" in most programming languages. Iterates through a collection. If a particular item in a collection throws an exception, the For Each scope will stop processing and invoke an error handler.
    - **Parallel For-Each:** Splits the message into parts and processes each message part in parallel.
    - **Batch:** Enable batch processing of records.
- **Database:** Connect to JDBC-compliant Databases
- **Salesforce:** Connect to Salesforce System.
- **HTTP**: A module to create HTTP(S) server or call an API via HTTP(S). 

