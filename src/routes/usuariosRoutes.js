//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import UsuarioController from '../controllers/usuarioController.js'

const routes = express.Router()

routes.get("/usuarios/", UsuarioController.getUsuarios)
// routes.get("/usuarios/preparo", UsuarioController.getusuariosPreparo)
// routes.get("/usuarios/:id", UsuarioController.getPedidoId)
routes.post("/usuarios/register/", UsuarioController.postUsuario)
// routes.put("/usuarios/:id", UsuarioController.putPedido)
// routes.delete("/usuarios/:id", UsuarioController.deletePedido)

export default routes