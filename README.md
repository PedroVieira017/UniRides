# UniRides - Plataforma de boleias

Aplicacao web para partilha de boleias entre membros da comunidade academica,
com autenticacao, gestao de boleias e comunicacao em tempo real.

## Instalacao
Requisitos:
- Node.js 18+
- MongoDB local ou Atlas

Clonar o repositorio:
```bash
git clone https://github.com/PedroVieira017/UniRides.git
cd UniRides
```

### Backend
```bash
cd backend
npm install
```

Criar `.env` no `backend/`:
```env
PORT=4000
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=http://localhost:5173
```

Executar:
```bash
npm run dev
```

### Frontend
```bash
cd frontend
npm install
```

Criar `.env` no `frontend/`:
```env
VITE_API_URL=http://localhost:4000
```

Executar:
```bash
npm run dev
```

## Membros do grupo
- Pedro Rodrigues Vieira n31389
- Diogo Viana n29195
- Pablo Mendes n31404

## Uso de IA (apenas nestas partes)
### Rotas populares (frontend)
Usamos IA apenas para apoiar a composicao do bloco "Rotas populares" (conteudo de exemplo e organizacao do layout). Depois, ajustamos manualmente os textos e a lista para ficar consistente com o resto da pagina.

Onde foi feito:
- `frontend/src/pages/RidesPage.jsx` (secao do bloco "Rotas populares")
- `frontend/src/App.css` (estilos do cartao)

O que precisamos para fazer:
- Apenas React/Vite ja instalado (sem dependencias extra)
- Texto/rotas finais definidos manualmente

### Chat da boleia (tempo real)
Usamos IA apenas para apoiar a estrutura base do fluxo em tempo real (eventos de envio/rececao e ligacao do socket) e a organizacao do UI do chat. O codigo final foi revisto e adaptado ao nosso backend e ao modelo de dados.

Onde foi feito:
- `backend/src/index.js` (Socket.IO: conexao, join da sala da boleia, broadcast)
- `backend/src/routes/messageRoutes.js` (rotas REST de mensagens)
- `frontend/src/api/socket.js` (cliente Socket.IO)
- `frontend/src/components/RideChat.jsx` (UI e logica)
- `frontend/src/pages/RideDetailsPage.jsx` (injecao do chat na pagina da boleia)
- `frontend/src/index.css` (estilos com apoio do chat)

O que precisamos para fazer:
- Dependencias: `socket.io` no backend e `socket.io-client` no frontend
- Backend e frontend a correr (ver secao Instalacao)
- Variavel `VITE_API_URL` apontada ao backend