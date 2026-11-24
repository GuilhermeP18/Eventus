# ADR 0001: Escolha do Banco de Dados para o Projeto

* **Status:** Aceito
* **Data:** 23/10/2026
* **Autores/Decisores:** Equipe de Desenvolvimento (com aprovação do professor orientador)

## Contexto e Problema
O projeto necessita de um sistema de gerenciamento de banco de dados (SGBD) que seja robusto e confiável para o ambiente de produção (entrega final). Ao mesmo tempo, a equipe precisa de agilidade e facilidade de configuração durante o ciclo inicial de desenvolvimento para acelerar a criação das funcionalidades.

## Opções Consideradas

* **Opção 1: Apenas H2 Database**
  * *Prós:* Banco em memória, configuração instantânea, ideal para testes rápidos.
  * *Contras:* Não possui a robustez necessária para produção e os dados são perdidos ao reiniciar a aplicação.
* **Opção 2: Apenas PostgreSQL**
  * *Prós:* SGBD relacional de nível de produção, altamente confiável, suporte a recursos avançados.
  * *Contras:* Requer instalação e configuração de ambiente local por todos os desenvolvedores desde o primeiro dia, o que pode atrasar o início do desenvolvimento.
* **Opção 3: H2 para Desenvolvimento + PostgreSQL para Produção/Entrega**
  * *Prós:* Une a velocidade de desenvolvimento do H2 em memória com a segurança e robustez do PostgreSQL na entrega final.
  * *Contras:* Exige atenção à compatibilidade de sintaxe SQL (dialetos) entre os dois bancos.

## Decisão Escolhida
A opção adotada foi a **Opção 3: H2 no ambiente de desenvolvimento e PostgreSQL no ambiente de produção (entrega)**. O PostgreSQL será o banco de dados principal do projeto, mas utilizaremos o H2 de forma temporária em *dev* para agilizar o setup da equipe e o ritmo das entregas.

## Consequências

### Positivas
* **Setup rápido:** Desenvolvedores conseguem rodar o projeto localmente de imediato, sem dependências externas de infraestrutura.
* **Ambiente de produção sólido:** A entrega final utilizará um banco de dados relacional amplamente consolidado no mercado.
* **Testes facilitados:** O H2 facilita a escrita de testes de integração automatizados que rodam rápido em memória.

### Negativas
* **Incompatibilidade de Dialetos:** Recursos ou queries específicas do PostgreSQL podem não funcionar no H2 (ou vice-versa).
  * *Mitigação:* Utilizaremos uma camada de abstração (como JPA/Hibernate) e evitaremos SQL nativo sempre que possível.
* **Esforço de Configuração de Perfis:** Será necessário configurar perfis de aplicação distintos (*profiles* de dev e prod) para alternar as conexões de banco de dados.

