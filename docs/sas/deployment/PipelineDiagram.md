# CICD Diagram

The diagram is a historical illustration. Current CI runs lint, build, unit, integration and browser checks. Pushes to `dev` publish and scan SHA-tagged images before staging deployment. Pushes of `v*` tags publish release images. Production deployment uses the separate manual workflow.


<figure markdown="span">
  <img src="../CICD.svg" alt="CICD Diagram" width="800">
</figure>
