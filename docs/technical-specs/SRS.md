# Software Requirements and Design Specifications

**Department of Computer Science**  
Faculty of Engineering, Built Environment & IT  
University of Pretoria  
COS301 - Software Engineering

**Item:** Mini Project 2026 – Phase 1  
**Team Name:** The head hunters

---

## Table of Contents

- [1 Project Owner](#1-project-owner)
- [2 Project Vision and Objectives](#2-project-vision-and-objectives)
- [3 Functional Requirements](#3-functional-requirements)
- [4 User Characteristics](#4-user-characteristics)
- [5 System Domain Model](#5-system-domain-model)
- [6 Subsystems](#6-subsystems)
  - [6.1 Subsystem X](#61-subsystem-x)
    - [6.1.1 Use Cases](#611-use-cases)
    - [6.1.2 Domain Model](#612-domain-model)
- [7 Traceability Matrix](#7-traceability-matrix)

---

## 1 Project Owner

The name and details of the owner of the project.

---

## 2 Project Vision and Objectives

Describe what the vision of the project is and provide some background on what problem the system is trying to solve. Then mix in the objectives of the system and discuss what the purpose of the objectives aims to achieve.

---

## 3 Functional Requirements

Describe the system's functionality on a high-level encapsulating AND abstracting functionality such that the function of the system can be understood, i.e. don't describe your use cases here. Use cases will be derived from the requirements together with the actors that are involved in the requirements.

The format for functional requirements can include:

- **The system should be able to provide functionality X**  
  Example: The system should be able to provide the ability to track user movement using GPS.

- **The system should manage entity/component X.** _(Normally concerned with CRUD operations on entities)_  
  Example: The system should be able to manage books.

- **The system should calculate Y**  
  Example: The system should be able to calculate the monthly sales of food items based on food categories.

- **The system should be able to integrate with X**  
  Example: The system should be able to integrate with LinkedIn to allow users to login with social profiles.

- **The system should make use of X to determine/execute/do Y**  
  Example: The system should make use of an AI model to recommend the best restaurant to the user.

---

## 4 User Characteristics

Your system will have different target users and different types of users. Your system might make use of role based access control and therefore, to know your type of users and their characteristics before hand is important. For example, you may need an Admin user who will carry out maintenance on the system as well as approve new users. In a nutshell you need to provide the characteristics of the users of your system.

---

## 5 System Domain Model

The domain model should show the various subsystems and relationships that the system entails to allow the reader to better understand the interplay between the various classes in your system. Ensure that when you reference a figure you make use of LaTeX `\ref` and `\label` markup tags.

> **Important:** A domain model is a **UML class diagram** and as such it is important to use the correct relationships which include:
>
> - Association
> - Directed Association
> - Reflexive Association (Self referential class, e.g. a node class of a linked list)
> - Aggregation
> - Composition
> - Inheritance/Generalization
> - Realization

_Figure 1: Example domain model sourced from [https://www.uml-diagrams.org/examples/hospital-domain-diagram.html](https://www.uml-diagrams.org/examples/hospital-domain-diagram.html)_

---

## 6 Subsystems

Description of the subsystems/microservices/packages/modules that will be present in your application. Important — this is focused on the **logical separation**, and not necessarily on how the project structure or applications will be physically structured. The decision on how the physical solution will be structured will be discussed in your Software Architecture Requirements and Design Specifications.

### 6.1 Subsystem X

Description of subsystem X. Why is subsystem X needed? What is the scope of the subsystem?

#### 6.1.1 Use Cases

An overview of the use cases that are in subsystem X. Important to note that **both a textual and graph representation** are required in this section. Ensure to make use of the Unified Modelling Language (UML) Standard for depicting use cases.

Five relationships are possible inside use case diagrams namely:

- **Association** between actor and use case
- **Generalization** of an actor
- **Extend** between two use cases
- **Include** between two use cases
- **Generalization** of a use case

_Figure 2: The scope of functionality required from the subsystem X. – Example sourced from Wikipedia_

#### 6.1.2 Domain Model

Description of the classes and the responsibility of this subsystem. Classes should not be present in more than one subsystem, as one and only one class should be the responsibility of a subsystem. Any interaction required on another class, in another subsystem will be invoked by way of a use case.

Any additional information, business requirements, constraints on the classes, interpretation of fields or relationships should also be explained.

_Figure 3: The domain model of subsystem X_

---

## 7 Traceability Matrix

Traceability matrices are used in software engineering to correlate any two baseline software items which could have a many-to-many relationship to one another. As such various traceability matrices exist such as a requirement traceability matrix and a testing traceability matrix; the former showing that the system satisfies all requirements, the latter showing that all tests cover the system.

The **requirement traceability matrix** should plot your requirements against your use cases. This ensures easy reference for all, as it assists in showcasing which use cases in the system relates to which identified requirements.

In COS301 we are concerned with showcasing a requirement traceability matrix for your client. Code testing will be done through automated unit testing and code coverage frameworks.

|          | R1  | R2  | R3  | ... |
| -------- | --- | --- | --- | --- |
| **U1.1** | X   | X   | X   |     |
| **U1.2** | X   | X   | X   |     |
| **U1.3** | X   |     |     |     |
| **U2.1** | X   | X   |     |     |
| **U3.1** | X   |     |     |     |
| **...**  | X   |     |     |     |

_Table 1: Requirement traceability matrix for project name_
