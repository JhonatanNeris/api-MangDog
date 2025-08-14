//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import ImpressaoController from '../controllers/impressaoController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'
import { authImpressao } from '../middlewares/autenticarTokenImpressao.js'

const routes = express.Router()

routes.post("/impressao/gerar-token", autenticarToken, ImpressaoController.criarTokenImpressao);
routes.post("/impressao/revogar-token", autenticarToken, ImpressaoController.revogarTokenImpressao);
routes.get("/impressao/status-token", autenticarToken, ImpressaoController.statusTokenImpressao);
routes.get("/impressao", authImpressao, ImpressaoController.getPedidosImpressao);
// routes.post("/ifood/auth/token", autenticarToken ,IfoodController.postToken)
// routes.post("/ifood/auth/refresh-token", autenticarToken ,IfoodController.refreshToken)
// routes.get("/ifood/events/polling", autenticarToken ,IfoodController.pollingEvents)
// routes.get("/pedidos/dodia", autenticarToken, IfoodController.getPedidosDoDia)
// routes.get("/pedidos/preparo", autenticarToken, IfoodController.getPedidosPreparo)
// routes.get("/pedidos/busca", autenticarToken, IfoodController.getPedidosFiltro, paginar)
// routes.get("/pedidos/:id", autenticarToken, IfoodController.getPedidoId)
// routes.post("/pedidos/novo", autenticarToken, IfoodController.postPedido)
// routes.put("/pedidos/:id", autenticarToken, IfoodController.putPedido)
// routes.put('/pedidos/:pedidoId/itens/:itemId', autenticarToken, IfoodController.putPedidoItem)
// routes.delete("/pedidos/:id", autenticarToken, IfoodController.deletePedido)

export default routes