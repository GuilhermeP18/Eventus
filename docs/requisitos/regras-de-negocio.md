# Regras de Negócio - Eventus

- **Projeto:** Sistema de Gestão de Eventos com Credenciamento (Eventus)
- **Fontes:** lista de regras RN001–RN028 e briefing oficial do projeto P03
- **Data:** 23/10/2026
- **Status:** Em validação com equipe e PO

## 1. Como ler este documento

Cada regra da lista original foi mantida e recebeu uma **situação** em relação ao escopo do MVP descrito no briefing:

| Situação | Significado |
|----------|-------------|
| **Dentro** | Coerente com o briefing; pode ser implementada como está. |
| **Adaptar** | A ideia faz parte do MVP, mas o texto precisa ser ajustado ao briefing (papéis, termos ou conceitos). |
| **Validar com PO** | Não consta no briefing. Só entra no MVP se o Product Owner aprovar. |
| **Fora de escopo** | Depende de algo que o briefing exclui deste bimestre (pagamento, mapa de assentos, múltiplos lotes). Fica registrada como backlog futuro. |

### Resumo

| Situação | Quantidade | Regras |
|----------|-----------:|--------|
| Dentro | 2 | RN002, RN027 |
| Adaptar | 7 | RN001, RN005, RN012, RN017, RN023, RN026, RN028 |
| Validar com PO | 10 | RN003, RN004, RN006, RN007, RN008, RN009, RN010, RN011, RN014, RN021 |
| Fora de escopo | 9 | RN013, RN015, RN016, RN018, RN019, RN020, RN022, RN024, RN025 |
| **Total** | **28** | |

> **Atenção:** a lista foi escrita para um sistema de **venda de ingressos** (carrinho, pagamento por PIX, reembolso, poltronas, lotes). O briefing do P03 exclui explicitamente "venda de ingressos e integração com pagamento", "mapa de assentos" e "múltiplos lotes de preço". Por isso quase metade das regras fica fora do MVP. Ver a seção 5.

## 2. Regras por domínio

### 2.1 Autenticação e conta

| ID | Regra | Situação | Observação |
|----|-------|----------|------------|
| RN001 | **Redirecionamento de Login com Sucesso.** Após a autenticação bem-sucedida com e-mail e senha corretos, o sistema deve verificar o papel do usuário (Cliente, Organizador ou Funcionário) e redirecioná-lo para a sua tela principal (/painel ou /meusingressos). | Adaptar | O briefing define os papéis Participante, Organizador e Operador de credenciamento, e exige autenticação apenas para organizadores e operadores. Se o participante terá conta depende da pergunta 1 da descoberta. |
| RN002 | **Falha de Login por Credenciais Inválidas.** Se o usuário errar o e-mail ou a senha, o sistema nega o acesso e exibe a mensagem "E-mail ou senha incorretos" sem especificar qual campo está errado. | Dentro | Atende ao requisito de segurança do briefing. |
| RN003 | **Bloqueio Temporário por Múltiplas Tentativas de Login.** Após 5 tentativas erradas seguidas no mesmo e-mail, o sistema bloqueia o login por 15 minutos para evitar tentativas brutas de acesso. | Validar com PO | Reforço de segurança não exigido pelo briefing. Exige controle de tentativas por usuário. |
| RN004 | **Restrição de Login de Conta Não Verificada.** Usuários que ainda não confirmaram o e-mail através do link enviado no cadastro não conseguem fazer login até realizarem a validação. | Validar com PO | Exige envio de e-mail. O briefing deixa o envio de e-mails em massa fora do MVP. |
| RN005 | **Restrição de CPF ou E-mail Duplicado no Cadastro.** O sistema não permite cadastrar duas contas com o mesmo CPF ou e-mail já existente na base de dados. | Adaptar | A unicidade do e-mail da conta faz sentido. O CPF depende da pergunta 3 (dados mínimos do participante). Não confundir com a regra do briefing sobre inscrição duplicada no mesmo evento (seção 3). |
| RN006 | **Expiração de Link de Recuperação de Senha.** O link enviado para redefinição de senha perde a validade após 24 horas da solicitação. | Validar com PO | Recuperação de senha não consta no briefing e depende de envio de e-mail. |
| RN007 | **Obrigatoriedade e Validação de Idade no Cadastro.** A data de nascimento é obrigatória no cadastro. O sistema calcula a idade e bloqueia o cadastro de menores de 13 anos sem autorização legal. | Validar com PO | Depende da pergunta 3 (dados mínimos) e envolve tratamento de dados de menores. |

### 2.2 Eventos

| ID | Regra | Situação | Observação |
|----|-------|----------|------------|
| RN008 | **Definição Obrigatória de Classificação Indicativa do Evento.** Ao criar um evento (/admin/novo-evento), o organizador precisa obrigatoriamente definir a faixa etária (Livre, 12, 14, 16 ou 18 anos). | Validar com PO | O briefing lista os campos do evento (título, descrição, data, horário, local, capacidade e período de inscrição) e não inclui classificação indicativa. |
| RN011 | **Auto-save de Rascunho de Evento.** Durante o preenchimento do cadastro de um evento, o formulário salva automaticamente o rascunho no navegador para evitar perda de dados. | Validar com PO | Melhoria de usabilidade, não exigida. Baixa prioridade. |
| RN012 | **Limite de Capacidade Máxima do Evento.** A soma dos ingressos de todos os lotes criados não pode ultrapassar a lotação máxima cadastrada para o local do evento. | Adaptar | Sem lotes no MVP, a regra vira: o número de inscrições ativas não pode ultrapassar a capacidade do evento (regra 1 do briefing). |
| RN013 | **Virada Automática de Lote de Ingressos.** Um novo lote fica disponível automaticamente assim que o lote anterior esgotar ou alcançar a data/hora estipulada. | Fora de escopo | Múltiplos lotes estão fora do escopo do bimestre. |

### 2.3 Compra e inscrição

| ID | Regra | Situação | Observação |
|----|-------|----------|------------|
| RN009 | **Bloqueio Automático de Compra por Faixa Etária.** Ao adicionar o ingresso ao carrinho, o sistema compara a idade do usuário com a faixa etária do evento. Se for menor, exige a vinculação do responsável legal. | Validar com PO | Depende da RN008, e o briefing não prevê carrinho. |
| RN010 | **Vinculação de Responsável Legal para Menores.** Para menores comprarem ingressos de eventos acima da sua idade, o sistema exige Nome e CPF do responsável legal mais aceite do termo. | Validar com PO | Depende das RN007 a RN009. |
| RN014 | **Limite de Compra por Usuário.** Cada usuário (CPF) só pode comprar no máximo 4 ingressos por evento para conter a ação de cambistas. | Validar com PO | Diferente da regra do briefing (uma inscrição ativa por e-mail no mesmo evento). Os dois limites não podem coexistir sem decisão do PO. |
| RN015 | **Bloqueio Temporário de Poltrona no Carrinho.** Ao escolher uma poltrona/ingresso, o item fica reservado temporariamente por 10 minutos para o cliente finalizar o pagamento. | Fora de escopo | Mapa de assentos e pagamento estão fora do escopo. |
| RN016 | **Liberação de Ingresso por Timeout no Checkout.** Se o cliente não pagar dentro do tempo limite de 10 minutos, o carrinho é esvaziado e a poltrona volta a ficar disponível. | Fora de escopo | Depende de pagamento e carrinho. |
| RN017 | **Falha por Ingresso Esgotado em Concorrência.** Em caso de acessos simultâneos no último ingresso, o primeiro que fechar a compra leva, e o outro recebe aviso de lote esgotado. | Adaptar | O conceito vale para a **última vaga** do evento. Exige garantia no backend (transação e/ou restrição no banco), como pede o requisito de integridade. Cobre o cenário de aceite "participantes preenchem todas as vagas". |
| RN018 | **Prevenção de Duplo Clique no Pagamento (Idempotência).** O sistema ignora cliques repetidos no botão "Pagar" durante o carregamento, garantindo que o pagamento seja processado apenas uma vez. | Fora de escopo | Não há pagamento no MVP. A ideia pode ser reaproveitada no botão de inscrição. |
| RN019 | **Expiração Automática de Pagamento PIX.** O código PIX gerado expira em 30 minutos. Se o pagamento não for confirmado pelo banco nesse prazo, a reserva é cancelada. | Fora de escopo | Integração com pagamento está fora do escopo. |
| RN020 | **Geração do Voucher Pós-Pagamento Confirmado.** O ingresso digital em PDF com o código do pedido só é gerado e liberado após a confirmação de pagamento aprovado. | Fora de escopo | Sem pagamento. Atenção: a **geração do código único de inscrição/credencial** é obrigatória no MVP, mas na inscrição, não após pagamento. |

### 2.4 Cancelamento e pós-venda

| ID | Regra | Situação | Observação |
|----|-------|----------|------------|
| RN021 | **Transferência de Titularidade de Ingresso.** O comprador pode alterar o nome e CPF do titular do ingresso apenas uma vez, com no mínimo 24 horas de antecedência do evento. | Validar com PO | Não consta no briefing. |
| RN022 | **Reembolso Voluntário Padrão (80% em até 48h).** O cliente pode pedir cancelamento com devolução de 80% do valor do ingresso se a solicitação for feita até 48 horas antes do início do evento. | Fora de escopo | Reembolso depende de pagamento. A janela de 48h pode servir de resposta à pergunta 2 (prazo de cancelamento). |
| RN023 | **Bloqueio de Reembolso Fora do Prazo Limite.** Pedidos de reembolso feitos com menos de 48 horas para o início do evento (ou após o evento) são negados automaticamente. | Adaptar | Sem o reembolso, vira: cancelamento só é aceito até o prazo limite (regra 3 do briefing e pergunta 2). |
| RN024 | **Retenção de Taxa da Plataforma em Reembolso.** A retenção de 20% no cancelamento é referente à taxa de serviço da plataforma, e as taxas financeiras do gateway não são reembolsadas. | Fora de escopo | Depende de pagamento e gateway. |
| RN025 | **Reembolso Integral por Cancelamento do Evento pelo Organizador.** Se o organizador cancelar o evento, o prazo de 48h é anulado e o sistema devolve 100% do valor a todos os compradores. | Fora de escopo | Depende de pagamento. Cancelar um evento inteiro também não consta no briefing. |

### 2.5 Credenciamento (portaria)

| ID | Regra | Situação | Observação |
|----|-------|----------|------------|
| RN026 | **Validação de Ingresso e Documento com Foto na Portaria.** O funcionário libera a entrada buscando o CPF ou código do ingresso no sistema e conferindo o documento oficial com foto do titular. | Adaptar | O briefing pede busca por **nome, e-mail ou código**. O CPF depende da pergunta 3. A conferência do documento é um procedimento presencial, fora do sistema. |
| RN027 | **Alerta de Entrada Já Registrada.** Se o CPF ou código consultado já tiver entrado no evento, o sistema avisa na tela que a entrada já foi realizada com o horário do acesso. | Dentro | Cobre as regras 5 e 6 do briefing e o cenário de aceite do segundo check-in. O sistema deve **impedir** o novo check-in, não apenas avisar. |
| RN028 | **Bloqueio de Ingresso Reembolsado na Portaria.** Ingressos cancelados ou reembolsados aparecem como inativos na busca do funcionário, impedindo a liberação do acesso. | Adaptar | Sem reembolso, vale para inscrições **canceladas** (regra 4 do briefing: check-in só para inscrição confirmada). |

## 3. Cobertura das regras obrigatórias do briefing

O briefing define 8 regras obrigatórias. A lista original cobre só parte delas, e **as lacunas abaixo precisam virar regras novas** (sugestão: RN029 em diante).

| # | Regra obrigatória do briefing | Coberta por | Lacuna |
|---|-------------------------------|-------------|--------|
| 1 | Inscrição só pode ocorrer dentro do período configurado e enquanto houver vagas. | RN012, RN017 (parcial) | O **período de inscrição** não aparece em nenhuma regra. |
| 2 | Um participante não pode ter duas inscrições ativas no mesmo evento com o mesmo e-mail. | Nenhuma | Regra inexistente. RN005 e RN014 tratam de outros assuntos. |
| 3 | Cancelamento libera a vaga novamente quando ocorrer antes do prazo limite. | RN023 (parcial) | Falta a **liberação da vaga** e a definição do prazo (pergunta 2). |
| 4 | Check-in só pode ocorrer para inscrição confirmada. | RN028 (parcial) | Explicitar o status "confirmada" e o bloqueio dos demais. |
| 5 | Cada inscrição permite no máximo um check-in. | RN027 (parcial) | A RN fala em alertar, é preciso deixar claro que o sistema **bloqueia**. |
| 6 | Check-in registra data/hora e operador responsável. | RN027 (parcial) | Falta registrar o **operador**. |
| 7 | Evento encerrado não aceita novas inscrições nem alterações de capacidade sem ação administrativa registrada. | Nenhuma | Regra inexistente. |
| 8 | Indicadores derivam dos dados reais de inscrições/check-ins, não de valores digitados. | Nenhuma | Regra inexistente (dashboard). |

## 4. Termos que precisam ser unificados

| Lista original | Briefing | Sugestão |
|----------------|----------|----------|
| Cliente | Participante | Usar **Participante** |
| Funcionário | Operador de credenciamento | Usar **Operador de credenciamento** |
| Ingresso | Inscrição / credencial | Usar **Inscrição** e **Código de credencial** |
| Compra, carrinho, pedido | Inscrição | Usar **Inscrição** |
| Reembolso | (não existe) | Usar **Cancelamento** |
| Lotação máxima / lote | Capacidade | Usar **Capacidade** |

## 5. Pontos para decidir com o Product Owner

1. **Escopo.** A lista foi escrita para venda de ingressos com pagamento. O briefing exclui isso. Confirmar que o MVP segue o briefing e que as regras "Fora de escopo" ficam como backlog futuro.
2. **Regras fora do briefing.** Decidir o destino das 10 regras "Validar com PO", especialmente login com bloqueio e verificação de e-mail (RN003, RN004, RN006), classificação indicativa e menores (RN007 a RN010) e transferência de titularidade (RN021).
3. **Limite por pessoa.** A RN014 (4 ingressos por CPF) conflita com a regra do briefing de uma inscrição ativa por e-mail. Qual vale?
4. **Perguntas de descoberta.** As respostas sobre conta do participante, prazo de cancelamento, dados mínimos e formato do código (ver `respostas-cliente.md`) mudam várias regras acima.
