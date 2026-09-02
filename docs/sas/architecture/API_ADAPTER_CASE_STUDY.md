# University API Adapter — Architectural Case Study

## 1. Case Study Overview

This case study examines the University API Adapter architecture within UMTAS. The purpose is to demonstrate how an architectural decision can address a specific non-functional requirement (NFR), with particular focus on **modifiability**.

The case study focuses on the problem of integrating external university APIs into UMTAS. University APIs are expected to differ in their endpoints, authentication mechanisms, response structures, naming conventions, pagination mechanisms, and error behaviour. Allowing these differences to propagate into the core UMTAS application would increase coupling and make future changes more expensive.

---

## 2. System Context

### 2.1 UMTAS and External University APIs

UMTAS must obtain university-specific information such as courses, modules, and events from external university systems.

The external APIs do not necessarily expose this information using the same structure as UMTAS. For example, an external API may represent a course as:

```
course_id
name
```

whereas UMTAS expects information represented as:

```
CourseID
CourseName
```

### 2.2 The Architectural Problem

> How can UMTAS integrate external university APIs while preventing university-specific implementation details from propagating into the core application?

---

## 3. Architectural Decision

### 3.1 Decision

UMTAS uses a University Adapter to isolate university-specific API communication and data transformation.

The architecture consists of:

- an abstract `University_Adapter` defining the common contract;
- concrete adapters implementing university-specific behaviour;
- an `AdapterRegistry` responsible for selecting the appropriate adapter;
- UMTAS services that interact with the `University_Adapter` rather than directly with a university-specific API.

The existing University of Maryland implementation is represented by the `ML_Adapter`.

### 3.2 University Adapter Contract

The abstract adapter defines the operations that UMTAS expects from a university integration.

The current contract is conceptually:

```typescript
abstract authenticate(): Promise<void>;

abstract getCourses(
    page: number,
    limit: number
): Promise<CreateCourseDto[]>;

abstract getModules(
    course: CourseDto
): Promise<CreateModuleDto[]>;

abstract getEvents(
    module: ModulesDto
): Promise<CreateEventDtoV2[]>;
```

The contract separates the internal representation expected by UMTAS from the external representation provided by a university.

### 3.3 Concrete Adapter Responsibilities

The concrete adapter is responsible for university-specific behaviour.
This keeps external API knowledge within the adapter boundary.

---

## 4. Quality Attribute

### 4.1 Selected Quality Attribute

<div align="center" markdown>

**Modifiability**

</div>

The focus is specifically on modifiability rather than replaceability.

The concern is whether support for another university can be introduced while limiting the impact of the change on the existing UMTAS system.

### 4.2 Why Modifiability

University APIs represent a volatile external dependency. Different universities may expose equivalent concepts using different:

- data structures;
- endpoint structures;
- authentication mechanisms;
- field names;
- pagination mechanisms;
- date and time formats.

These differences are expected to change independently of the UMTAS core.

---

## 5. Non-Functional Requirement

### 5.1 NFR-01: University API Modifiability

!!! note "NFR-01"
    Adding support for a new university API shall not require modification of existing production components outside the University API Adapter layer.

This requirement intentionally does not state that zero code changes are allowed.

Adding a new adapter is expected to require changes within the adapter boundary, such as:

- creating the new concrete adapter;
- registering the new adapter with the `AdapterRegistry`.

The requirement is instead concerned with the *propagation* of the change into the remainder of the system.

### 5.2 NFR Measure

**Measure:** Number of existing production components outside the University API Adapter layer that must be modified when introducing a new university API.

### 5.3 NFR Target

<div align="center" markdown>

**0 existing production components outside the Adapter layer.**

</div>

---

## 6. Architectural Tactics

The following architectural tactics support NFR-01.

### 6.1 Isolate the Volatile Part

The university-specific API integration is treated as the volatile part of the system.

Instead of allowing this volatility to enter the core application, it is isolated inside concrete adapters.

<!-- Insert diagram: Stable UMTAS Core -> University_Adapter -> {ML_Adapter, Other Adapter} -> {Maryland API, Other University API} -->
![Isolating volatile university-specific behaviour behind the adapter layer](images/tactic-isolate-volatile-part.png)

Changes to an external API should therefore primarily affect the corresponding adapter.

### 6.2 Depend on an Abstraction

UMTAS code should depend on the `University_Adapter` abstraction rather than a concrete university implementation.

This reduces direct coupling between the UMTAS core and external university systems.

---

## 7. Design Patterns

### 7.1 Adapter Pattern

The primary design pattern is the Adapter pattern.

Each concrete adapter converts an external university API into the interface expected by UMTAS.

<!-- Insert diagram: Maryland API representation -> ML_Adapter -> UMTAS DTOs -->
![The adapter converts the Maryland API representation into UMTAS DTOs](images/pattern-adapter.png)

The adapter therefore acts as a boundary between two incompatible representations.

---

## 8. Architectural Trade-offs

### 8.1 What the Architecture Buys

The adapter architecture provides several benefits:

- university-specific API behaviour is isolated;
- external API changes have a limited change boundary;
- authentication can differ between concrete adapters;
- external data mapping is kept out of core business services;
- new integrations can be added using the existing contract;
- the core application is less tightly coupled to external systems.

These benefits directly support the selected modifiability NFR.

### 8.2 What the Architecture Costs

The architecture introduces additional complexity.

Instead of allowing the core to communicate directly with an external API, communication passes through an additional abstraction and a concrete adapter.

This introduces:

- additional classes;
- an additional layer of indirection;
- the need to maintain the adapter contract;
- registry or factory logic;
- additional implementation effort for each new university.

The architecture therefore trades simplicity for modifiability.

---

## 9. Architectural Change Scenario

### 9.1 Scenario

Consider the requirement to add support for a second university.

<!-- Insert diagram: before state — University_Adapter -> ML_Adapter -> Maryland API -->
![Before: single adapter integration with Maryland](images/scenario-before.png)

<!-- Insert diagram: after state — University_Adapter -> {ML_Adapter, New_Adapter} -> {Maryland API, New University API} -->
![After: a second adapter added alongside the existing Maryland adapter](images/scenario-after.png)

### 9.2 Expected Change Boundary

The expected modifications are limited to the adapter layer.

| Component | Expected Change | Required? |
|---|---|---|
| New concrete adapter | Add | Yes |
| AdapterRegistry | Modify | Yes |
| University_Adapter | Modify | Ideally no |
| CourseService | Modify | No |
| ModuleService | Modify | No |
| EventService | Modify | No |
| Database layer | Modify | No |
| Controllers | Modify | No |

*Table: Expected change boundary for a new university integration*

The registry is considered part of the Adapter layer. Consequently, modifying the registry does not violate NFR-01.

The architectural objective is therefore not zero changes to the repository. It is zero propagation of the integration change outside the designated adapter boundary.

---

## 10. NFR Verification

### 10.1 Verification Approach

The NFR can be verified by integrating a second university API that differs from the existing Maryland API.

The second API should have differences in its endpoints, response structures, authentication, or naming conventions. This demonstrates whether university-specific differences remain contained within the Adapter layer.

The verification process is:

1. Record the baseline version of the UMTAS codebase.
2. Implement a new concrete adapter for the second university API.
3. Register the adapter with the `AdapterRegistry`.
4. Connect the adapter to the second university API.
5. Verify that the adapter provides the operations required by UMTAS.
6. Inspect the resulting source-code change set.
7. Count existing production components modified outside the Adapter layer.

### 10.2 Pass Condition

The NFR passes if:

$$
\text{Number of existing non-adapter production components modified} = 0
$$

A passing result should therefore show that the changes are contained within the Adapter layer:

```
Changed:
AdapterRegistry

Added:
New_Adapter

Unchanged:
CourseService
ModuleService
EventService
Controllers
Database layer
Other non-adapter components
```

The new adapter may contain university-specific API requests, authentication, response mapping, and error handling. These differences should not require changes to existing non-adapter components.

---

## 11. Case Study Findings

The University API Adapter architecture demonstrates how an architectural boundary can be used to control the impact of external system changes.

The primary finding is that the architecture places university-specific behaviour behind a stable internal contract. Consequently, the core UMTAS application does not need to understand the implementation details of individual university APIs.

The architecture therefore supports the selected quality attribute of modifiability.

However, the architecture does not make new integrations completely free of change. A new adapter and its registration are still required. The architectural benefit is that the change is constrained to the adapter boundary rather than propagated throughout the application.

The architecture also introduces an abstraction cost. The `University_Adapter` contract must remain sufficiently general to accommodate multiple universities without becoming a collection of provider-specific features.

---

## 12. Conclusion

This case study investigated the University API Adapter architecture as an example of modifiability as a quality attribute.

The architectural problem is the variability of external university APIs. The selected solution is to isolate that variability using a common adapter abstraction and concrete university-specific adapters.

The primary NFR is:

> Adding support for a new university API shall not require modification of existing production components outside the University API Adapter layer.

The corresponding measure is the number of existing non-adapter production components modified during the addition of a new integration, with a target of zero.

The architecture achieves this by combining the tactics of isolating volatile behaviour, depending on abstractions, and establishing an explicit boundary contract. The Adapter pattern provides the primary mechanism, supported by strategy-based adapter selection and dependency inversion.

The principal trade-off is additional abstraction and indirection in exchange for reduced change propagation. This trade-off is appropriate because external university APIs represent a known source of architectural volatility.

Overall, the University API Adapter provides a concrete example of how an architectural design can be traced from a quality attribute, through an NFR and architectural tactics, to patterns, implementation, and measurable verification.