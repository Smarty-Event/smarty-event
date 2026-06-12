#!/usr/bin/env bash

# Color codes for premium CLI output styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color
BOLD='\033[1m'

print_banner() {
  echo -e "${CYAN}====================================================================${NC}"
  echo -e "${BOLD}${PURPLE}                 SmartyEvents Platform Dashboard                    ${NC}"
  echo -e "${CYAN}====================================================================${NC}"
}

print_info() {
  echo ""
  echo -e "${GREEN}🚀 Services are up and running! Here is the configuration:${NC}"
  echo ""
  echo -e "  ${BOLD}💻 Web App (Next.js):${NC}    ${CYAN}http://localhost:3000${NC}"
  echo -e "  ${BOLD}🔌 API (NestJS):${NC}        ${CYAN}http://localhost:3001${NC}"
  echo -e "  ${BOLD}🔍 Prisma Studio:${NC}       ${CYAN}http://localhost:5555${NC}"
  echo -e "  ${BOLD}🗄️  Database (Postgres):${NC} Host: ${CYAN}localhost${NC} | Port: ${CYAN}5433${NC}"
  echo -e "                            User: ${YELLOW}shield${NC} | Pass: ${YELLOW}shield${NC} | DB: ${YELLOW}smarty_events${NC}"
  echo ""
  echo -e "${YELLOW}To check container logs, run:   ${NC}${BOLD}docker compose logs -f${NC}"
  echo -e "${YELLOW}To stop the stack, run:         ${NC}${BOLD}./manage.sh --stop${NC}"
  echo -e "${CYAN}====================================================================${NC}"
}

print_usage() {
  echo "Usage: ./manage.sh [OPTION]"
  echo ""
  echo "Options:"
  echo "  --start, start       Start all containers in detached mode (Default)"
  echo "  --stop, stop         Stop all running containers"
  echo "  --rebuild, rebuild   Force rebuild all containers without cache and start"
  echo "  --help, help         Show this help information"
  echo ""
}

# Determine the action based on arguments
ACTION="start"
if [ "$#" -gt 0 ]; then
  case "$1" in
    --start|start)
      ACTION="start"
      ;;
    --stop|stop)
      ACTION="stop"
      ;;
    --rebuild|rebuild)
      ACTION="rebuild"
      ;;
    --help|help|-h)
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_usage
      exit 1
      ;;
  esac
fi

# Run docker action
if [ "$ACTION" = "start" ]; then
  echo -e "${BLUE}Starting SmartyEvents container stack...${NC}"
  docker compose up -d
  if [ $? -eq 0 ]; then
    print_banner
    print_info
  else
    echo -e "${RED}Error: Failed to start Docker containers.${NC}"
    exit 1
  fi

elif [ "$ACTION" = "stop" ]; then
  echo -e "${YELLOW}Stopping SmartyEvents container stack...${NC}"
  docker compose down
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Services stopped successfully.${NC}"
  else
    echo -e "${RED}Error: Failed to stop Docker containers.${NC}"
    exit 1
  fi

elif [ "$ACTION" = "rebuild" ]; then
  echo -e "${BLUE}Rebuilding and starting SmartyEvents container stack...${NC}"
  docker compose build --no-cache
  if [ $? -eq 0 ]; then
    docker compose up -d
    if [ $? -eq 0 ]; then
      print_banner
      print_info
    else
      echo -e "${RED}Error: Failed to start Docker containers after rebuild.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}Error: Failed to rebuild Docker containers.${NC}"
    exit 1
  fi
fi
