# Prerequisites
- Docker
# Command line
- Install rabbitmq cli: https://www.rabbitmq.com/install-homebrew.html
- Command line tools: https://www.rabbitmq.com/cli.html
# Run rabbitmq
- docker-compose up
- Access to container: docker exec -it <containerId> /bin/sh
- Access UI:
    - Access to: http://localhost:15672/
    - Username/password (Get from docker env variables): <RABBITMQ_DEFAULT_USER>/<RABBITMQ_DEFAULT_PASS>