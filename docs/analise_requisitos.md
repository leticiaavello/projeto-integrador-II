# Definição dos Requisitos do Sistema

A definição dos requisitos funcionais e não funcionais foi realizada a partir do levantamento das necessidades identificadas no contexto escolar da E.E. Washington Luiz, considerando os processos relacionados à utilização e à gestão de salas, laboratórios e equipamentos tecnológicos.

Para a especificação do sistema, foram consideradas as atribuições dos diferentes usuários envolvidos nesses processos, bem como as responsabilidades e os níveis de acesso necessários para cada função.

A partir desse levantamento, foram estabelecidos três perfis de usuários:

- **Professor**
- **Coordenação**
- **Secretaria**

O perfil **Professor** contempla as funcionalidades relacionadas à realização de reservas de salas, laboratórios e equipamentos.

O perfil **Coordenação** abrange a administração das reservas e dos recursos, incluindo o bloqueio administrativo de horários, salas, laboratórios e equipamentos, além do gerenciamento das reservas existentes.

O perfil **Secretaria** contempla o gerenciamento do cadastro de salas, laboratórios e equipamentos, incluindo o controle patrimonial, o registro e acompanhamento das informações de manutenção, bem como o bloqueio dos recursos quando estiverem indisponíveis em decorrência de manutenção ou avarias.

A definição dos requisitos busca estabelecer de forma clara as funcionalidades que deverão ser disponibilizadas pelo sistema, bem como as condições e características necessárias para seu funcionamento.

Dessa forma, os requisitos foram organizados em:

- **Requisitos funcionais**, que descrevem as funcionalidades e operações que o sistema deverá oferecer;
- **Requisitos não funcionais**, que estabelecem aspectos relacionados à segurança, desempenho, usabilidade, acessibilidade, disponibilidade e integridade das informações.

Essa especificação tem como objetivo orientar o desenvolvimento do sistema, garantindo que as funcionalidades implementadas estejam alinhadas às necessidades da instituição e às responsabilidades atribuídas a cada perfil de usuário.

---

# 1. Requisitos Funcionais

Os requisitos funcionais descrevem as funcionalidades que o sistema deverá disponibilizar aos usuários, considerando os três perfis definidos: **Professor, Coordenação e Secretaria**.

## 1.1 Professor

O perfil Professor realiza reservas de salas, laboratórios e equipamentos.

| ID | Requisito |
|---|---|
| **RF01** | O sistema deve permitir que o professor realize login com suas credenciais. |
| **RF02** | O sistema deve permitir que o professor consulte a disponibilidade de salas, laboratórios e equipamentos. |
| **RF03** | O sistema deve permitir que o professor realize reservas de salas. |
| **RF04** | O sistema deve permitir que o professor realize reservas de laboratórios. |
| **RF05** | O sistema deve permitir que o professor realize reservas de equipamentos. |
| **RF06** | O sistema deve permitir que o professor informe a data, o horário e a finalidade da reserva. |
| **RF07** | O sistema deve verificar a disponibilidade do recurso antes de confirmar uma reserva. |
| **RF08** | O sistema deve impedir que um mesmo recurso seja reservado para dois usuários no mesmo período. |
| **RF09** | O sistema deve permitir que o professor consulte suas próprias reservas. |
| **RF10** | O sistema deve permitir que o professor cancele uma reserva, conforme as regras estabelecidas pela instituição. |

## 1.2 Coordenação

A Coordenação será responsável pela administração das reservas e pelo controle administrativo da disponibilidade dos recursos, podendo bloquear horários e recursos para impedir novas reservas, além de gerenciar as reservas realizadas pelos professores.

| ID | Requisito |
|---|---|
| **RF11** | O sistema deve permitir que a Coordenação visualize todas as reservas cadastradas. |
| **RF12** | O sistema deve permitir que a Coordenação consulte reservas por sala, laboratório, equipamento, professor, data ou período. |
| **RF13** | O sistema deve permitir que a Coordenação gerencie as reservas realizadas pelos professores. |
| **RF14** | O sistema deve permitir que a Coordenação bloqueie horários para impedir novas reservas. |
| **RF15** | O sistema deve permitir que a Coordenação bloqueie salas ou laboratórios para reservas por motivos administrativos. |
| **RF16** | O sistema deve permitir que a Coordenação bloqueie equipamentos para reservas por motivos administrativos. |
| **RF17** | O sistema deve permitir que a Coordenação desbloqueie horários e recursos previamente bloqueados administrativamente. |
| **RF18** | O sistema deve permitir que a Coordenação altere ou cancele reservas, conforme as regras estabelecidas pela instituição. |
| **RF19** | O sistema deve informar à Coordenação possíveis conflitos ou sobreposições de reservas. |
| **RF20** | O sistema deve permitir que a Coordenação consulte a disponibilidade das salas, laboratórios e equipamentos, bem como seus dados de identificação e localização. |
| **RF21** | O sistema deve permitir que a Coordenação consulte relatórios de utilização de salas, laboratórios e equipamentos. |

## 1.3 Secretaria

A Secretaria será responsável pelo cadastro e gerenciamento de salas, laboratórios e equipamentos, incluindo o controle patrimonial e o acompanhamento das informações relacionadas à manutenção e à disponibilidade dos recursos.

| ID | Requisito |
|---|---|
| **RF22** | O sistema deve permitir que a Secretaria cadastre salas. |
| **RF23** | O sistema deve permitir que a Secretaria cadastre laboratórios. |
| **RF24** | O sistema deve permitir que a Secretaria cadastre equipamentos. |
| **RF25** | O sistema deve permitir que a Secretaria registre o número de patrimônio do equipamento. |
| **RF26** | O sistema deve permitir que a Secretaria registre um número simplificado de identificação do equipamento. |
| **RF27** | O sistema deve permitir que a Secretaria cadastre informações dos equipamentos, como tipo, modelo, marca, localização e descrição. |
| **RF28** | O sistema deve permitir que a Secretaria atualize os dados cadastrais dos equipamentos. |
| **RF29** | O sistema deve permitir que a Secretaria consulte equipamentos por número de patrimônio, número simplificado, tipo, localização ou situação. |
| **RF30** | O sistema deve permitir que a Secretaria registre a situação do equipamento, como disponível, em manutenção, indisponível ou fora de uso. |
| **RF31** | O sistema deve permitir que a Secretaria registre e atualize informações relacionadas à manutenção dos equipamentos. |
| **RF32** | O sistema deve manter o histórico de alterações cadastrais e de manutenção dos equipamentos. |
| **RF33** | O sistema deve impedir que equipamentos registrados como indisponíveis ou fora de uso sejam disponibilizados para novas reservas. |
| **RF34** | O sistema deve permitir que a Secretaria bloqueie salas ou laboratórios devido à necessidade de manutenção ou indisponibilidade do espaço. |
| **RF35** | O sistema deve permitir que a Secretaria desbloqueie salas ou laboratórios após o término da manutenção ou da indisponibilidade. |
| **RF36** | O sistema deve permitir que a Secretaria bloqueie equipamentos devido a defeitos, manutenção ou outras situações que impeçam sua utilização. |
| **RF37** | O sistema deve permitir que a Secretaria desbloqueie equipamentos após o término da manutenção ou regularização de sua situação. |

## 1.4 Funcionalidades Gerais do Sistema

| ID | Requisito |
|---|---|
| **RF38** | O sistema deve identificar o perfil do usuário e disponibilizar somente as funcionalidades autorizadas para seu perfil. |
| **RF39** | O sistema deve permitir a consulta de salas, laboratórios e equipamentos cadastrados. |
| **RF40** | O sistema deve registrar as operações realizadas pelos usuários. |
| **RF41** | O sistema deve disponibilizar a confirmação das reservas realizadas. |
| **RF42** | O sistema deve atualizar a disponibilidade dos recursos após a realização, alteração ou cancelamento de uma reserva. |
| **RF43** | O sistema deve considerar os bloqueios administrativos realizados pela Coordenação ao verificar a disponibilidade para novas reservas. |
| **RF44** | O sistema deve considerar os bloqueios decorrentes de manutenção ou indisponibilidade realizados pela Secretaria ao verificar a disponibilidade para novas reservas. |
| **RF45** | O sistema deve disponibilizar informações atualizadas sobre a situação dos recursos para os usuários autorizados. |
| **RF46** | O sistema deve impedir a realização de reservas para recursos que estejam bloqueados administrativamente ou indisponíveis por manutenção. |

---

# 2. Requisitos Não Funcionais

## 2.1 Segurança

| ID | Requisito |
|---|---|
| **RNF01** | O sistema deve proteger o acesso às informações por meio de autenticação dos usuários. |

## 2.2 Controle de Acesso

| ID | Requisito |
|---|---|
| **RNF02** | O sistema deve restringir as funcionalidades de acordo com o perfil do usuário: Professor, Coordenação ou Secretaria. |

## 2.3 Proteção de Credenciais

| ID | Requisito |
|---|---|
| **RNF03** | As senhas devem ser armazenadas de forma segura, utilizando mecanismos adequados de proteção criptográfica. |

## 2.4 Confidencialidade

| ID | Requisito |
|---|---|
| **RNF04** | O sistema deve impedir o acesso não autorizado a dados de usuários, reservas, patrimônio e manutenção. |

## 2.5 Integridade das Reservas

| ID | Requisito |
|---|---|
| **RNF05** | O sistema deve garantir que um mesmo recurso não seja reservado simultaneamente para diferentes usuários no mesmo período. |

## 2.6 Integridade dos Dados Patrimoniais

| ID | Requisito |
|---|---|
| **RNF06** | As informações referentes aos números de patrimônio, números simplificados e demais dados dos equipamentos devem ser mantidas de forma íntegra e consistente. |

## 2.7 Consistência da Disponibilidade

| ID | Requisito |
|---|---|
| **RNF07** | A disponibilidade apresentada pelo sistema deve refletir reservas, cancelamentos e bloqueios administrativos ou de manutenção. |

## 2.8 Desempenho

| ID | Requisito |
|---|---|
| **RNF08** | As consultas de disponibilidade, reservas e recursos devem apresentar resposta em tempo adequado para não prejudicar a utilização do sistema. |

## 2.9 Desempenho das Consultas

| ID | Requisito |
|---|---|
| **RNF09** | O sistema deve permitir consultas e filtros por data, período, recurso, professor, patrimônio, número simplificado, tipo, localização e situação sem degradação significativa do desempenho. |

## 2.10 Disponibilidade

| ID | Requisito |
|---|---|
| **RNF10** | O sistema deve permanecer disponível durante os períodos de utilização definidos pela instituição. |

## 2.11 Usabilidade

| ID | Requisito |
|---|---|
| **RNF11** | A interface deve apresentar as funcionalidades de forma clara, organizada e intuitiva para os três perfis de usuários. |

## 2.12 Responsividade

| ID | Requisito |
|---|---|
| **RNF12** | A interface deve adaptar-se a diferentes tamanhos de tela, incluindo computadores, tablets e smartphones. |

## 2.13 Acessibilidade

| ID | Requisito |
|---|---|
| **RNF13** | O sistema deve seguir boas práticas de acessibilidade, possibilitando sua utilização por pessoas com diferentes necessidades. |

## 2.14 Compatibilidade

| ID | Requisito |
|---|---|
| **RNF14** | O sistema web deve ser compatível com os principais navegadores utilizados pelos usuários. |

## 2.15 Rastreabilidade

| ID | Requisito |
|---|---|
| **RNF15** | O sistema deve registrar operações relevantes, identificando o usuário responsável, a operação realizada, a data e o horário. |

## 2.16 Histórico

| ID | Requisito |
|---|---|
| **RNF16** | O sistema deve preservar o histórico das alterações cadastrais, reservas, bloqueios e informações de manutenção. |

## 2.17 Backup

| ID | Requisito |
|---|---|
| **RNF17** | O sistema deve realizar cópias de segurança periódicas dos dados armazenados. |

## 2.18 Recuperação de Dados

| ID | Requisito |
|---|---|
| **RNF18** | O sistema deve possuir mecanismos que possibilitem a recuperação dos dados em caso de falhas ou perda de informações. |

## 2.19 Privacidade

| ID | Requisito |
|---|---|
| **RNF19** | O tratamento dos dados pessoais deve observar os princípios e requisitos aplicáveis da LGPD. |

## 2.20 Manutenibilidade

| ID | Requisito |
|---|---|
| **RNF20** | O sistema deve possuir uma estrutura organizada e documentada, facilitando sua manutenção, correção e evolução. |

## 2.21 Escalabilidade

| ID | Requisito |
|---|---|
| **RNF21** | O sistema deve permitir a inclusão de novos usuários, salas, laboratórios e equipamentos sem necessidade de alterações estruturais significativas. |

## 2.22 Confiabilidade

| ID | Requisito |
|---|---|
| **RNF22** | O sistema deve executar de forma consistente as operações de reserva, bloqueio, cadastro, consulta e atualização dos recursos. |

## 2.23 Auditoria

| ID | Requisito |
|---|---|
| **RNF23** | As operações administrativas relacionadas às reservas, bloqueios, alterações cadastrais, patrimônio e manutenção devem ser rastreáveis. |

## 2.24 Atualização das Informações

| ID | Requisito |
|---|---|
| **RNF24** | As alterações realizadas por usuários autorizados devem ser refletidas nas consultas dos demais usuários autorizados, respeitando os níveis de acesso. |
