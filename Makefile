DOCKER_COMPOSE_FILE=srcs/docker-compose.yml
DOCKER_COMPOSE=docker-compose

.PHONY: all dev build down stop start lf lb re exec logs

dev:
	mkdir -p ./srcs/build
	NODE_PROJET=dev $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

prod: down
	mkdir -p ./srcs/build
	NODE_PROJET=production $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

restart:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) restart frontend backend

exec-backend:
	docker exec -it backend zsh

exec-frontend:
	docker exec -it frontend zsh

down:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans --rmi all
	rm -rf ./srcs/build/*
	docker volume prune -f
	docker exec -it backend rm -rf ./logs/*

start:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) start

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop

# log frontend
lf:
	clear
	docker logs -f frontend

# log backend
lb:
	clear
	docker exec -it backend pm2 logs api_transcendence

re: down dev

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f