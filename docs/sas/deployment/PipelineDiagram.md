# CICD Deployment Diagram


<figure markdown="span">
  <img src="../CICD.svg" width="800">
  <figcaption>Fig 1. CICD Pipeline</figcaption>
</figure>


## Diagram Key

| Shape | Color | Represents |
|---|---|---|
| Rounded pill (stadium) | Blue | Trigger event — what starts a pipeline run |
| Rectangle | Black | GitHub Actions job / pipeline stage |
| Cylinder | Magenta / Pink | Artifact produced, and where it's stored |
| Rectangle, dashed border | Grey | External system outside GitHub Actions (e.g. Watchtower) |
| Hexagon | Red / Salmon | Manual approval gate |
| Rectangle | Blue-violet / Purple | Notification job (sends to Discord) |