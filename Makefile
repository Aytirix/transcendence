DOCKER_COMPOSE_FILE=srcs/docker-compose.yml
DOCKER_COMPOSE=docker-compose
export COMPOSE_BAKE=true
.PHONY: all dev build down stop start lf lb re exec logs

dev:
	bash ./srcs/shared/env/generate_env.sh first
	bash ./srcs/shared/certificates/generate.sh first
	mkdir -p ./srcs/build
	NODE_PROJET=dev $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

prod: down
	bash ./srcs/shared/env/generate_env.sh first
	bash ./srcs/shared/certificates/generate.sh first
	mkdir -p ./srcs/build
	NODE_PROJET=production $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up --build -d

restart:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) restart frontend backend

exec-backend:
	docker exec -it backend zsh

exec-frontend:
	docker exec -it frontend zsh

down: clearlogs
	bash ./srcs/shared/env/generate_env.sh first
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down --volumes --remove-orphans --rmi all
	rm -rf ./srcs/build/*
	docker volume prune -f

start:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) start

stop:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop

clearlogs:
	docker exec -it backend rm -rf ./logs || true
	docker exec -it frontend rm -rf ./logs || true

# log frontend
lf:
	clear
	docker logs -f transcendence_frontend

generate_env:
	bash ./srcs/shared/env/generate_env.sh

generate_ca:
	bash ./srcs/shared/certificates/generate.sh

clear: down
# 	supprimer tout les .env
	find ./srcs/shared -type f -name ".env" -exec rm -f {} \;
	find ./srcs/shared -type f -name "*.key" -exec rm -f {} \;
	find ./srcs/shared -type f -name "*.crt" -exec rm -f {} \;
	find ./srcs/shared -type f -name "*.csr" -exec rm -f {} \;
	rm -rf ./srcs/container/backend/srcs/sqlite/sessions.sqlite
	rm -rf ./srcs/container/backend/srcs/sqlite/transcendence.sqlite
	rm -rf ./srcs/container/backend/srcs/logs
	rm -rf ./srcs/container/backend/srcs/node_modules
	rm -rf ./srcs/container/backend/srcs/minecraft_data
	rm -rf ./srcs/container/backend/srcs/uploads
	rm -rf ./srcs/container/frontend/srcs/node_modules

# log backend
lb:
	clear
	docker exec -it transcendence_backend pm2 logs api_transcendence

re: clearlogs down dev

logs:
	$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs -f