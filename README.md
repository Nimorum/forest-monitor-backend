# Forest Monitor - Backend & Dashboard 🌲🔥

Este repositório contém a aplicação web central (Backend e Frontend) para o **Sistema Distribuído de Monitorização Microclimática Baseado em LoRa**, focado na avaliação preventiva de risco de incêndio em floresta gerida.

## 📌 Sobre o Projeto
O sistema recebe, armazena e processa dados microclimáticos recolhidos no terreno. As principais funcionalidades incluem:
- **API RESTful:** Receção de dados do Gateway Central via rotas protegidas por Sanctum (API Keys).
- **Base de Dados:** Armazenamento histórico e consulta eficiente de séries temporais (Temperatura, Humidade, Vento, Humidade do Solo).
- **Dashboard Web:** Visualização do estado da rede de sensores num mapa interativo e análise evolutiva através de gráficos.
- **Gestão de Acessos:** Controlo de permissões entre utilizadores humanos (leitura/gestão) e Gateways (escrita).

## 🛠️ Stack Tecnológica
- **Framework:** Laravel (PHP)
- **Base de Dados:** MySQL / MariaDB
- **Autenticação:** Laravel Sanctum (Tokens)
- **Frontend:** Blade, TailwindCSS, Chart.js, Leaflet.js

## 🚀 Instalação Local
1. `git clone <url-do-repo>`
2. `composer install` e `npm install && npm run build`
3. Copiar `.env.example` para `.env` e configurar a BD.
4. `php artisan key:generate`
5. `php artisan migrate`
6. `php artisan serve`
