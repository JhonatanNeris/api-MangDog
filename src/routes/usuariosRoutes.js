//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import UsuarioController from '../controllers/usuarioController.js'

const routes = express.Router()

// routes.get("/pedidos/", UsuarioController.getPedidos)
// routes.get("/pedidos/preparo", UsuarioController.getPedidosPreparo)
// routes.get("/pedidos/:id", UsuarioController.getPedidoId)
routes.post("/usuarios/register/", UsuarioController.postUsuario)
// routes.put("/pedidos/:id", UsuarioController.putPedido)
// routes.delete("/pedidos/:id", UsuarioController.deletePedido)

export default routes