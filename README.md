# Sistema Web e Mobile de Gestão de Salas, Espaços e Equipamentos Escolares

Projeto Integrador desenvolvido no curso de **Bacharelado em Ciência de Dados da Universidade Virtual do Estado de São Paulo (UNIVESP)**.

## Sobre o projeto

O projeto propõe o desenvolvimento de um sistema web e mobile para auxiliar a gestão de salas, espaços e equipamentos de uma instituição de ensino, centralizando informações e processos relacionados à utilização dos recursos escolares.

Atualmente, o agendamento e o controle de utilização de salas, laboratórios e equipamentos podem depender de agendas físicas, planilhas ou comunicação informal entre os responsáveis.

Esse processo pode dificultar a consulta de disponibilidade, gerar conflitos de horários e tornar mais difícil o acompanhamento histórico da utilização dos espaços e equipamentos.

A solução proposta busca centralizar essas informações em uma plataforma digital, permitindo que os usuários consultem disponibilidade, realizem reservas e acompanhem ocorrências relacionadas aos recursos da escola.

## Integrantes 
* Alan Felix Benjamin
* Beatriz Guimarães Tricoli
* Cecília de Camargo Rocha
* Felipe Roberto Ribeiro
* Giulia Zacchi
* Letícia Rodrigues Avello
* Paula Santana Galvão
* Patrícia Almeida Barbosa


## Objetivo geral

Desenvolver um sistema web e mobile para apoiar a gestão, o agendamento e o controle de utilização de salas, espaços e equipamentos escolares.

## Objetivos específicos

* Centralizar informações sobre salas, espaços e equipamentos;
* Permitir a consulta de disponibilidade dos recursos;
* Realizar e gerenciar reservas;
* Reduzir conflitos de agendamento;
* Registrar ocorrências relacionadas aos espaços e equipamentos;
* Apoiar o acompanhamento de manutenção;
* Disponibilizar informações para consulta remota;
* Registrar o Termo de Responsabilidade Anual dos usuários responsáveis;
* Gerar informações sobre a utilização dos recursos.

## Tecnologias utilizadas

O sistema está sendo desenvolvido com as seguintes tecnologias:

- Backend: Python e Django.
- Prototipação e criação inicial da interface: Figma Make.
- Frontend: React e JavaScript.
- Interface: React Bootstrap.
- Banco de dados: PostgreSQL.
- Controle de versão: Git e GitHub.

## Estrutura do projeto

O repositório está organizado em diretórios que separam a aplicação web, o backend e os arquivos de apoio ao projeto.

- "backend/": código do servidor, regras de negócio, modelos de dados, autenticação e migrações do Django.
- "homepage-conversion/": código da interface frontend.
- "app/": estrutura inicial do antida no repositório.
- "docs/": diretório destinado à documentação do projeto.

## Banco de dados

A aplicação utiliza PostgreSQL para armazenar os dados relacionados à gestão escolar. O backend Django contém os modelos e as migrações utilizados para criar e atualizar a estrutura das tabelas.

As credenciais de acesso ao banco devem ser configuradas por meio de variáveis de ambiente, sem serem publicadas no repositório.

## Ambiente de desenvolvimento

Para executar o sistema, é necessário configurar o ambiente Python e instalar as dependências do backend, instalar as dependências do frontend com npm e configurar uma instância do PostgreSQL.

As instruções completas de instalação, configuração do banco e inicialização dos servidores serão documentadas conforme a consolidação do ambiente de desenvolvimento.

## Status do projeto

O projeto encontra-se em desenvolvimento. A estrutura inicial do sistema foi implementada, com backend Django, frontend React e configuração de acesso ao banco de dados. As funcionalidades serão integradas e testadas progressivamente durante o desenvolvimento do Projeto Integrador.
