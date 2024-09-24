//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import PedidoController from '../controllers/pedidoController.js'

const routes = express.Router()

routes.get("/pedidos/", PedidoController.getPedidos)
routes.get("/pedidos/preparo", PedidoController.getPedidosPreparo)
routes.get("/pedidos/busca", PedidoController.getPedidosFiltro)
routes.get("/pedidos/:id", PedidoController.getPedidoId)
routes.post("/pedidos/novo/", PedidoController.postPedido)
routes.put("/pedidos/:id", PedidoController.putPedido)
routes.delete("/pedidos/:id", PedidoController.deletePedido)

export default routes