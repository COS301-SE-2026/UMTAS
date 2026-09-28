# Quality Requirement Mapping

This mapping connects each primary SRS quality attribute scenario to the architectural decisions
that support it, the current UMTAS realisation, and the evidence required to demonstrate it.
Architectural support does not by itself prove that a requirement has been satisfied. A target is
reported as achieved for Demo 4 only after its complete, repeatable fitness function passes on the
assessed release in the stated environment. The [SRS NFR evidence section](../../srs/NON-FUNCTIONAL_REQUIREMENTS.md#evidence-and-test-reports)
is the status register for all quality requirements.

| **Quality attribute scenario** | **Technology-neutral architectural response** | **Current UMTAS realisation and status** | **Fitness function / evidence** |
|---|---|---|---|
| **NFR-Corr-1 - Supported timetable PDF extraction correctness** | Isolate source-specific extraction behind an extension point and validate canonical output at every system boundary. | The parser registry, University of Pretoria adapter, canonical result schemas, worker validation, and authenticated callback path implement the required boundaries. The reviewed ground-truth fixtures cover nine supported UP inputs. The branch test passed; a result for the assessed release remains to be retained. | `test_up_ground_truth.py` compares complete canonical results with the reviewed manifest, calculates field-level precision and recall, rejects omitted or invented records and fields, and requires exact equality. The 28 September parser suite output, linked through the NFR page, records 69 passing tests. Retain a CI run on the assessed revision. |
| **NFR-Corr-2 - Conflict-free schedule correctness** | Enforce hard constraints during generation, validate output independently, and prevent an invalid result from being labelled conflict-free. | Independently selectable solver engines, shared result contracts, conflict metadata, and the automatic best-effort path are implemented. The local regression run linked through the NFR page stopped at a preferred-start-time assertion, so complete acceptance evidence remains pending. | Build the assessed revision and run every feasible and known conflict edge-case fixture. An independent hard-constraint validator must accept every result labelled `conflict-free`, calculate zero overlapping pairs, and agree with the reported outcome and conflict metadata. |
| **NFR-Sec-1 - Student timetable confidentiality** | Minimise disclosed data, separate individual and aggregate views, enforce least privilege at the privacy boundary, and make privacy violations auditable. | Authentication, platform roles, university roles, and guarded API boundaries are implemented. The analytics aggregation boundary, identifier dissociation, privacy audit record, and re-identification test are not yet implemented; this requirement is therefore not demonstrated. | Use a synthetic dataset containing known identities and schedules. Verify that administrators cannot retrieve individual schedules, inspect responses, exports, aggregate storage, and logs for identifiers, then execute the documented re-identification attempt. All three measures must remain zero. |
| **NFR-Scale-1 - University-scale scheduling workload** | Keep synchronous request handling bounded, move long-running work to asynchronous processing, apply back-pressure, and allow processing capacity to scale independently. | The Core API, persisted job records, BullMQ queues, and separately deployable parser and solver workers provide partial support. A reusable Locust workload exists in `apps/NFR/` and a September staging run reached 100 users. The 20,000-user production target remains untested. | Run the documented workload on the production host with 20,000 active virtual users for a 15-minute steady state. At least 99% of submission and status requests must succeed, p95 latency must remain at or below 2 seconds, and no accepted job may be lost. Record queue depth, queue-completion time, and host resource use separately. |
| **NFR-Maint-1 - University adapter modifiability** | Isolate volatile university formats behind a stable canonical contract and register new implementations without changing consumers of that contract. | The parser base contract, adapter registry, University of Pretoria adapter, canonical result schema, and adapter regression tests support this change boundary. A controlled new-adapter diff inspection remains to be recorded. | Add a test adapter and inspect the resulting diff. No Core API, persistent-schema, queue-contract, worker-orchestration, or existing-adapter implementation file may change, and all canonical contract and existing-adapter regression tests must pass. |

## Deployment and Evidence Constraint

Production measurements use the client-provided x86-64 cloud server. The currently recorded host has
4 logical CPUs, 4,009,160 KiB of RAM, and no swap. Every report shall record the actual host
specification at measurement time so that changed infrastructure does not invalidate comparisons.

The privacy boundary lacks a recorded re-identification test, and the scale harness has been run
at only 100 concurrent users. Neither client acceptance target is demonstrated. Documentation,
diagrams and technology descriptions shall not call either target achieved until its complete
fitness function passes.
