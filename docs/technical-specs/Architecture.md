# Software Architecture Requirements and Design Specifications

**Department of Computer Science**  
Faculty of Engineering, Built Environment & IT  
University of Pretoria  
COS301 - Software Engineering

**Item:** Mini Project 2026  
**Team Name:** The head hunters

---

## Table of Contents

- [Intent of Architecture Document](#intent-of-architecture-document)
- [1 Overall Software Architecture](#1-overall-software-architecture)
  - [1.1 Architectural Quality Requirements](#11-architectural-quality-requirements)
    - [1.1.1 Flexibility](#111-flexibility)
    - [1.1.2 Maintainability](#112-maintainability)
    - [1.1.3 Scalability](#113-scalability)
    - [1.1.4 Performance](#114-performance)
    - [1.1.5 Reliability](#115-reliability)
    - [1.1.6 Security](#116-security)
    - [1.1.7 Auditability](#117-auditability)
    - [1.1.8 Testability](#118-testability)
    - [1.1.9 Usability](#119-usability)
    - [1.1.10 Integrability](#1110-integrability)
  - [1.2 Architectural Responsibility](#12-architectural-responsibility)
  - [1.3 Architecture Constraints](#13-architecture-constraints)
- [2 Architectural Component A](#2-architectural-component-a)
  - [2.1 Architectural Quality Requirements](#21-architectural-quality-requirements)
    - [2.1.1 Quality Requirement A](#211-quality-requirement-a)
  - [2.2 Architectural Responsibility](#22-architectural-responsibility)
  - [2.3 Frameworks and Technologies](#23-frameworks-and-technologies)
  - [2.4 Architectural Realization Mapping](#24-architectural-realization-mapping)
  - [2.5 Technology Choice](#25-technology-choice)
- [3 Summary](#3-summary)

---

## Intent of Architecture Document

In the architectural document, a discussion on the overall system is expected, thereafter, each architectural component is discussed on a granular level. For each architectural component, focus on the requirements around the software infrastructure of the application's functionality. The purpose of the infrastructure is to address the non-functional requirements. Consider the following:

- the architectural responsibilities which need to be addressed,
- the access and integration requirements for the system,
- the quality requirements, and
- the architecture constraints specified by the client.

---

## 1 Overall Software Architecture

This section should contain a discussion on the high-level architecture of your software system using the following bullet points ensuring to **discuss each level of granularity** for the **overall software architecture**.

- All discussions in this section should focus on the system as a whole.

- At the **first level of granularity** for the overall software architecture, a discussion on whether your system will be using:
  - Client-Server architecture
  - Peer-to-peer architecture

- The **second level of granularity** for the overall software architecture, deals with the communication patterns that your software architecture will utilise between various subsystems. These include:
  - Request-Response Model
  - Message brokering
  - Event driven messaging
  - Push-pull model

  Application level communication protocols and standards should also be considered as they place architectural constraints on components lower down in the system. Communications protocols and standards include:
  - **Messaging protocols**
    - Simple Object Access Protocol (SOAP)
    - Representational state transfer (REST)
    - Message Queuing Telemetry Transport (MQTT)
    - Advanced Message Queuing Protocol (AMQP)
    - HyperText Transfer Protocol (HTTP)
  - **Queryable protocols**
    - Open Data Protocol (OData)
    - GraphQL
  - **Distributed Object Brokering (DOB)**
    - Common Object Request Broker Architecture (CORBA)
  - **Remote Procedure Call (RPC)**
    - Apache Thrift
    - gRPC
    - Extensible Markup Language RPC (XML-RPC)

- The **third level of granularity** for the overall software architecture, deals with the architectural patterns that will be utilized within each subsystem. It is important to note that various patterns can be combined within one subsystem. Architectural patterns include:
  - Layered (n-Tier) architecture
  - Command-Query Responsibility Segregating (CQRS)
  - Domain Driven Design (DDD)
  - Event Sourcing (ES)
  - Service Oriented Architecture (SOA)
  - Enterprise Service Bus (ESB)
  - Microservices

- Include a figure to show the high-level architecture of your system, ensuring Figure 1 shows a high-level overview of the software architecture. In particular, it shows the high-level architecture as a client-server and layered architecture, implying that a request-response model will be the primary form of communication with the system. The architecture furthermore highlights the different architectures for different subsystems and how they interact.

_Figure 1: A high-level overview of the software architecture for project name._

> **Note:** This should be technology neutral as the high-level architecture covers the design of the system. Technologies never choose your architecture, rather you use architectural strategies and patterns to help you choose a technology.

---

### 1.1 Architectural Quality Requirements

The quality requirements are the requirements around the quality attributes of the systems and the services it provides. This includes quality requirements like maintainability, flexibility, extensibility, performance, scalability, security, auditability, usability, and testability requirements. It is important to note that **not all systems will have all the above mentioned quality attributes**.

The proceeding subsections discuss how to define these quality requirements with relevant quantifications. **Note:** quality requirements are also technology neutral.

#### 1.1.1 Flexibility

Discuss why the system needs to be flexible and provide the necessary quantifications of reasonable thresholds that the system should be able to achieve.

**Example:** It is important for the system to be flexible such that new adaptations to the architecture can be made for adding newer subsystems or swapping out layers in favour of better business decisions. The flexibility of the system can be measured by checking:

- by ensuring the cyclomatic complexity of functions are kept low,
- high code modularity,
- ensuring tight cohesion, loose coupling between different modules,
- code compliance with coding convention,
- ensuring code is self-documenting and readable,
- ensuring that there is no direct implementation on used packages, but that all external packages are placed behind standardized APIs or are ring-fenced by application interfaces,
- a combination of other software measures such as bugs, vulnerabilities, code smells, maintainability ratings can all be considered together to determine the flexibility of a system.

#### 1.1.2 Maintainability

Discuss why the maintainability of the system is important and why this is a concern for the longevity of the system. Quantify the maintainability of the system by describing the life cycle or life span on the system and which factors need to be considered to further the ability of the system to run for the expected life span.

**Example:** It is important for the system to be maintainable such that the services rendered can be consumed with minimal disruptions to business operations. The maintainability of the system can be measured by checking:

- the maintainability Index using some defined measure, such as maintainability rating provided by SonarQube,
- Cyclomatic Complexity,
- Depth of Inheritance,
- Class Coupling, etc.

#### 1.1.3 Scalability

Discuss why the scalability of the system is important and how future growth might affect the system. How will your system be able to handle this growth, i.e. what is your scaling strategy, horizontal or vertical scaling. Quantify the scalability of the system by describing what is the minimum amount of users/sessions/traffic load/processing load/classification that needs to be done over a time period, e.g. 1min, 5min, 15min, 1hour, 24hours etc.

**Example:** As the system will be used to assist ER personnel in prioritising patients, it is important the system can scale to ensure it can prioritise at least 15 patients per minute. The scalability of the system can be measured by checking:

- executing concurrent connection requests,
- executing ramp-up testing to ensure that minimum thresholds are met,
- chaos testing ensuring predefined thresholds are met.

#### 1.1.4 Performance

Discuss why the performance of the system is important and what the effects of performance can have on the users. Quantify performance by providing metrics of acceptable ranges on factors that affect performance.

**Example:** The system needs to be performant as it manages hospital equipment, thereby needed to respond to multiple patients at once as this could be a matter of life and death. The performance of the system can be measured by checking:

- the number of requests the system can handle per second (e.g. 100 requests per second).
- the average/max response time for requests (e.g. A maximum of 300ms to handle a request).

#### 1.1.5 Reliability

Discuss why the reliability of the system is important and how it will affect the operations of your system. Although it is difficult to quantify reliability, there are manual checks and methods to achieve this.

**Example:** The system needs to be reliable as it deals with medical equipment thereby ensuring that operations continue as expected and nothing prevents the system of going into a fail state, or doing operations that are not expected due to bugs. The reliability of the system can be measured by checking:

- the hardware components to ensure they function as expected.
- the correctness of the system.
- the ability to restart or recover from a system failure.

#### 1.1.6 Security

Discuss why the security of the system is important and what would the implications of this quality attribute. Quantify security by performing security testing, and passing security audits that look for specific configurations and loopholes.

**Example:** The security of the system is paramount as the system monitors medical equipment. Therefore, the system should not allow unauthorized access or the ability to switch off equipment without authorization. The security of the system can be measured by checking:

- security standards and specification (e.g. using AES512 encryption, and SHA512 hashing, etc.).
- OWASP application security guidelines.
- mitigating attacks (Injection attacks, CSRF, etc).

#### 1.1.7 Auditability

Discuss why the auditability of the system is important and the concerns of being transparent. Quantify auditability by specifying the logging level and the type of information that should be auditable.

**Example:** As users interact with the system accountability and auditability needs to be accounted for as a record of which individual turned off equipment should be logged as well as any errors or exceptions thrown by the system. The auditability of the system can be measured by checking:

- error logs, application logs, access logs.
- adding granular logging abilities to traceback activity.

#### 1.1.8 Testability

Discuss why the testability of the system is important and the implications of code that is not tested, what code coverage is expected and what type of tests should be conducted.

**Example:** The system should test all functions and operations thereby it is important that unit, integration, regression tests are implemented with code testing coverage above 80%. The testability of the system can be measured by checking:

- automation of unit tests on a CI/CD platform.
- checking the build status of the system.
- checking the code testing coverage.

#### 1.1.9 Usability

Discuss why the usability of the system is important and how your users will interact with your system, what the UI interfaces should have and how it would be tested/quantified.

**Example:** The system should be intuitive to use and easy to interact with providing the best user experience. Therefore, the use of shocking bright colors are to be avoided and good positioning of elements to maximise space usage without cluttering the UI. The usability of the system can be measured by checking:

- prototyping of user screens.
- developing wireframes.
- performing UI tests (both using frameworks or physical tests with a small group of real users).

#### 1.1.10 Integrability

Discuss why the integrability of the system is important and how being able to integrate with other systems needs to be achieved. Quantify integrability by using your architecture and provide the metrics of being able to integrate.

**Example:** The system should be able to integrate with external services and integration testing between each service should be carried out passing all tests and checking regression testing to ensure that the system was always in working state. Using a microservices architecture allowed the system to easily integrate with services as there is separation of concerns. The integrability of the system can be measured by using two approaches:

- top-down integration
- bottom-up integration

---

### 1.2 Architectural Responsibility

The architectural responsibility are components within your architecture that is responsible for carrying out certain tasks within the architecture. For example, a `TransactionManager` responsibility is needed for management of database transactions in the architecture.

---

### 1.3 Architecture Constraints

- Discussion on the architectural constraints that are imposed by **external factors** such as the client, end-users device specifications, constraints imposed by an external API/service/partner/application/environment/hardware.

- **Important** to note that any subjective constraints as mentioned below are unacceptable and should **not** appear in a technology neutral architectural specification:
  - We only know language/framework/technology X
  - We really want to learn/play/explore with language/framework/technology X

> Repeat Sections 2 – 2.5 for each identified architectural component in your system.

---

## 2 Architectural Component A

Discussion on how this component fits together into your overall architecture, which other components depends on this component, how does this component interact with other components.

### 2.1 Architectural Quality Requirements

Discussion about the required architecture requirements that needs to be present for this system. Which architecture requirements are propagated down from the Overall Software Architecture.

#### 2.1.1 Quality Requirement A

Repeat for each quality requirement for architectural component A.

- Discussion around the quality requirement, why is it important, what is the requirement.
- Quality requirements that can be considered are:
  - Flexibility
  - Maintainability
  - Scalability
  - Performance
  - Reliability
  - Security
  - Auditability
  - Testability
  - Usability
  - Integrability
  - Deployability

---

### 2.2 Architectural Responsibility

Discussion about the architectural responsibilities that you have identified. This is part of the scientific process of technology neutral software engineering. After identification of the requirements, the next section will investigate the frameworks and technologies that could possibly satisfy the required responsibilities.

The architectural responsibilities of the architectural component A are shown in Figure 2.

_Figure 2: A high-level overview of the architectural responsibilities for architectural component A_

---

### 2.3 Frameworks and Technologies

Discussion around the technologies and framework that you will consider to realize the identified responsibilities above. It is always good to compare **at least three frameworks and technologies**. Important to note that if your chosen technology or framework is not a full featured framework, that requires you to utilise external or community projects, such as a node backend, you should identify **at least three modules/projects/libraries** for each of the responsibilities that you will be satisfying with an external library. Discussion can also resolve about the type of licenses if that is a consideration that should be taken into account.

Your scientific analysis here of identifying which framework satisfies your responsibilities the best, will be the architectural framework going forward.

---

### 2.4 Architectural Realization Mapping

This section is concerned with showing how the identified framework above realizes each of the responsibilities you have identified. This will assist not only yourself but other interested readers to identify how your concrete system fits together.

_Figure 3: The components in framework A addressing the architectural responsibilities for architectural Component A_

---

### 2.5 Technology Choice

Make a decision on what technology will be used for this subsystem and explain why this technology was chosen. As part of your reasoning ensure that it is scientific and not objective.

---

## 3 Summary

Conclude this document with a summary that binds all the technology choices together, forming your effective **"technology stack"**. This technology stack will be used to assist in developing your deployment diagrams and models later on.
