//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import PedidoController from '../controllers/pedidoController.js'

//MIDDLEWARES
import paginar from '../middlewares/paginar.js'
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/pedidos/", autenticarToken, PedidoController.getPedidos, paginar)
routes.get("/pedidos/dodia", autenticarToken, PedidoController.getPedidosDoDia)
routes.get("/pedidos/preparo", autenticarToken, PedidoController.getPedidosPreparo)
routes.get("/pedidos/busca", autenticarToken, PedidoController.getPedidosFiltro, paginar)
routes.get("/pedidos/:id", autenticarToken, PedidoController.getPedidoId)
routes.post("/pedidos/:id/cancelar", autenticarToken, PedidoController.cancelarPedido)
routes.post("/pedidos/novo", autenticarToken, PedidoController.postPedido)
routes.put("/pedidos/:id", autenticarToken, PedidoController.putPedido)
routes.put('/pedidos/:pedidoId/itens/:itemId', autenticarToken, PedidoController.putPedidoItem)
routes.delete("/pedidos/:id", autenticarToken, PedidoController.deletePedido)

export default routes