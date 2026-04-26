## Initial Hardening

written by Marcel Stoltz
24 Apr 2026

Before we installed any services we ensured that all entry points are secure.

# 1 SSH Port Remapping

We moved the ssh port from port 22 to another port(2222) to drastically reduce the background noise logs from potential automated attacks.

# 2 Key-only Auth ->something to consider:

<!-- We disables password authentication due to the fact that passwords can be guessed or leaked. Using Keys make brute-forcing the passwords essentially impossible. -->

# 3 Enable UFW

This firewall acts as our outer gate. We deny all incoming traffic by default,ensuring that when we unknowingly expose an internal container port that it won't be publicly accessible. We would need to whitelist to expose the port.

# 4 Docker Engine

We installed Docker and Docker Compose to ensure that every environment runs an identical binary. Environment in this case is prod/dev.

# 5 Repository Prep

We cloned the repo to a specific deployment home to keep it seperated from user files and system binaries.

## Server Philosophy -> GitOps/Infrastructure As Code

Why? If our server stops tomorrow, we essentially have all the config required to spin up a replacement server with minimal fuss. This ensures Vigil does not encounter config drift. We can confidently know that our stagiing code is a mirror image of our repo.
