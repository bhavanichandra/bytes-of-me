---
title: "MuleSoft Database Connector"
tags: [mulesoft]
date: 2022-01-01
description: "TODO: subtitle needed before publishing"
draft: true
---

# MuleSoft Database Connector

Hey guys, Let us do a deep dive into the Database Connector. This article focuses on Datasource connection, the de-facto standard for Spring Applications to connect to the database.

The DataSource connection provides us with various features

- Connection Pooling
- Robust Connection Framework
- Use External Connection Pooling libraries such as DBCP2.

# Prerequisites:

The following things are required:

- Anypoint Studio IDE
- Database JDBC Driver - PostgreSQL (or any JDBC-Compliant database java driver)
- Spring Module / MuleSoft Connector - Needed, if Data Source Configuration is selected
- DBCP2 Connection Pooling Library - Needed, if Data Source Configuration is selected

# Scenario:

Assume that you have a requirement where you need to interface with the PostgreSQL database. Requirement is to create, update, delete, and get data from PostgreSQL. You decided to develop a System API and wanted to use MuleSoft to achieve this.

# Solution:

MuleSoft provides developers with a fully-featured database connector. It allows us to communicate with JDBC Compliant Relational Databases. The following are the configurations it supports.

- Data Source Configuration
- MySQL Configuration
- JDBC URL Configuration
- SQL Server Configuration
- Derby Configuration

In this tutorial, I’m going to explain two types of configuration rest are similar in configuration.

> Whatever connection configuration you choose, the operation of the database remains similar, though with some performance improvement.

## Data Source Configuration:

To briefly explain this, Java uses a Data Source connection to communicate with databases via JDBC drivers. This data source provides us with a way to set the database credentials. JDBC driver contains a Driver class, which has all the abstractions needed for us to connect to the database.
A few reasons to choose a data source is, it has good support for connection pooling and tuning performance.

### Configuration:


![db-1.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244646458/iqf8yTATv.png)

Here we just need to provide a data source ref, as the Data Source ref is provided by spring beans. For that purpose, we must add spring module to our application.


![db-2.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244658461/oaYny7N4M.png)

Once this is added, notice here I have entered, a **spring-context.xml** in Files text box. This file will have spring beans. The configuration file is stored in `src/main/resources` path. The contents of the file look as below:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:jpa="http://www.springframework.org/schema/data/jpa"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd
		http://www.springframework.org/schema/data/jpa http://www.springframework.org/schema/data/jpa/spring-jpa.xsd">
	
	<bean id="dataSource" class="org.apache.commons.dbcp2.BasicDataSource"
		destroy-method="close">
		<property name="driverClassName" value="org.postgresql.Driver" />
		<property name="url" value="${db.url}" />
		<property name="username" value="${db.username}" />
		<property name="password" value="${db.password}" />
	</bean>
</beans>
```

Observations from above config file:

- `org.apache.commons.dbcp2.BasicDataSource` is the class from the  connection pooling library.
- `org.postgresql.Driver` is the JDBC driver class name for PostgreSQL.
- `${db.url}` contains the JDBC URL. Format:  `jdbc:postgres://HOST:PORT/DATABASE_NAME`.
- `${db.username}` is the username for the database.
- `${db.password}` is the password for the database.

> Here, `${key}` are called Spring Properties, which can be loaded using configuration-properties connection configuration
> 

Now let’s add the JDBC driver for PostgreSQL and a data source library which provides good connection pooling capabilities. 

```xml
<dependency>
	<groupId>org.postgresql</groupId>
	<artifactId>postgresql</artifactId>
	<version>42.4.0</version>
</dependency>
<dependency>
<groupId>org.apache.commons</groupId>
	<artifactId>commons-dbcp2</artifactId>
	<version>2.9.0</version>
</dependency>
```

For the spring module to get access to these libraries, add them to sharedLibrary configuration.


![db-3.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244667635/eFdKj7aGl.png)

This is required for mule to provide the classes needed for Spring Module. The plugin bootstraps the needed classes and provides them.

Since properties should not be exposed, we use configuration properties file. It will contains above properties. config.yaml should be placed in `src/main/resources` folder


![db-4.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244687080/NrIA1YkGv.png)

Add configuration property global element and provide the file name as below

![db-5.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244695126/R7_Oq9ZPA.png)

Once above configuration is done, check if the connection is made. 


![db-6.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244706479/wypggIrge.png)

## Connector Usage:

Assume, we have a Users table in database with some data. Let’s create a flow as shown below. 

![db-7.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244728345/C3RBeBP_N.png)

The flow contains:

- **Http Listener**: It starts a HTTP server which can be accessed on port 8081
- **Select (Database Connector)**: This enables use to write sql to get data from database.
- **Transform Message**: Transforms response to JSON

![db-8.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244717891/V5xdo_TlC.png)

Second flow is to insert data to database:

![db-9.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244746964/ES6f5J3Nd.png)

The database connector:

![db-10.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1655244757168/wBtfZ75XU.png)

The source code for this can be found at: [Repository](https://github.com/themuler/mulesoft-database-connector-example)