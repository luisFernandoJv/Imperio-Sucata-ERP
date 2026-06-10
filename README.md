<div align="center">

# 🏭 Império Sucata — Sistema de Gestão

**Sistema completo para gestão de ferro-velho com controle de estoque, transações, relatórios e análises financeiras em tempo real.**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.4.0-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.9-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.9-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/Licença-Privada-red?style=flat-square)](./LICENSE)

</div>

---

## 📌 Visão Geral

O **Império Sucata** é uma plataforma web desenvolvida para modernizar e automatizar a gestão operacional e financeira de ferro-velhos. Integra controle de estoque, registro de transações, relatórios detalhados e um dashboard analítico em uma única interface responsiva e intuitiva.

---

## ✨ Funcionalidades

### 📊 Dashboard

- KPIs financeiros em tempo real (vendas, compras, lucros)
- Gráficos de tendências e desempenho
- Top 5 materiais mais lucrativos
- Visão consolidada do negócio

### 💰 Gestão de Transações

- Registro de compras, vendas e despesas
- Cálculo automático de valores
- Suporte a múltiplas formas de pagamento
- Impressão de comandas e recibos
- Histórico completo de movimentações

### 📦 Controle de Inventário

- Atualização de estoque em tempo real via Cloud Functions
- Alertas automáticos de estoque baixo
- Análise de margem de lucro por material
- Filtros e ordenação inteligente

### 📈 Relatórios e Análises

- Relatórios diários, semanais e mensais
- Exportação em PDF e Excel
- Análise por material e por forma de pagamento
- Relatórios por período personalizado

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia      | Versão   | Finalidade                   |
| --------------- | -------- | ---------------------------- |
| React           | 19.1.0   | Interface de usuário         |
| Vite            | 7.1.9    | Build e dev server           |
| React Router    | 7.9.4    | Roteamento SPA               |
| Tailwind CSS    | 4.1.9    | Estilização                  |
| Recharts        | 2.15.4   | Gráficos e visualizações     |
| Framer Motion   | 12.23.24 | Animações                    |
| React Hook Form | 7.60.0   | Gerenciamento de formulários |
| Zod             | 3.25.76  | Validação de schemas         |

### Backend & Infraestrutura

| Tecnologia                   | Finalidade                |
| ---------------------------- | ------------------------- |
| Firebase Authentication      | Autenticação de usuários  |
| Cloud Firestore              | Banco de dados NoSQL      |
| Cloud Functions (Node.js 18) | Lógica serverless         |
| Firebase Storage             | Armazenamento de arquivos |
| jsPDF                        | Geração de relatórios PDF |
| XLSX                         | Exportação para Excel     |

---

## 📁 Estrutura do Projeto

```
imperiosucata/
├── functions/                  # Firebase Cloud Functions
│   ├── index.js                # Funções serverless
│   ├── package.json
│   └── .eslintrc.js
│
├── sistema/                    # Aplicação React (frontend)
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── contexts/           # Context API (estado global)
│   │   ├── lib/                # Bibliotecas e configurações
│   │   ├── pages/              # Páginas da aplicação
│   │   └── utils/              # Funções utilitárias
│   ├── public/
│   └── package.json
│
├── firebase.json               # Configuração Firebase
├── firestore.rules             # Regras de segurança
└── firestore.indexes.json      # Índices do Firestore
```

---

## 🗃️ Modelo de Dados (Firestore)

### `transactions`

```js
{
  id: string,
  tipo: 'compra' | 'venda' | 'despesa',
  material: string,
  quantidade: number,
  precoUnitario: number,
  valorTotal: number,
  vendedor: string,
  formaPagamento: string,
  data: Timestamp,
  observacoes: string
}
```

### `inventory/current`

```js
{
  [material]: {
    quantidade: number
  }
}
```

### `daily_reports/{date}`

```js
{
  date: Timestamp,
  dateString: string,
  totalSales: number,
  totalPurchases: number,
  totalExpenses: number,
  totalProfit: number,
  materialStats: {},
  paymentStats: {}
}
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clone o repositório

```bash
git clone <repository-url>
cd imperiosucata
```

### 2. Instale as dependências

```bash
# Frontend
cd sistema && npm install

# Cloud Functions
cd ../functions && npm install
```

### 3. Configure as variáveis de ambiente

Crie o arquivo `.env` dentro da pasta `sistema/`:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 4. Autentique no Firebase

```bash
firebase login
```

---

## ▶️ Executando o Projeto

### Desenvolvimento Local

```bash
# Iniciar o frontend
cd sistema
npm run dev
# Acesse: http://localhost:5173

# Iniciar emuladores Firebase (completo)
firebase emulators:start
```

### Build de Produção

```bash
cd sistema
npm run build
```

### Deploy

```bash
firebase deploy                        # Deploy completo
firebase deploy --only functions       # Apenas Cloud Functions
firebase deploy --only hosting         # Apenas frontend
firebase deploy --only firestore:rules # Apenas regras de segurança
```

---

## 🔒 Segurança

- Autenticação gerenciada pelo Firebase Auth
- Regras de segurança granulares no Firestore
- Validação de dados aplicada no frontend (Zod) e no backend (Cloud Functions)
- HTTPS obrigatório em ambiente de produção

---

## 📄 Licença

Este projeto é **privado e proprietário**. Todos os direitos reservados.  
Uso, cópia ou distribuição sem autorização expressa são proibidos.

---

## 👤 Autor

Desenvolvido por **Luis Fernando**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-luisfernando--eng-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/luisfernando-eng)
[![Email](https://img.shields.io/badge/Email-luisfernando--engcp%40gmail.com-D14836?style=flat-square&logo=gmail)](mailto:luisfernando-engcp@gmail.com)
