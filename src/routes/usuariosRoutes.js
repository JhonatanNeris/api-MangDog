//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import UsuarioController from '../controllers/usuarioController.js'
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/usuarios/", UsuarioController.getUsuarios)
routes.get("/usuarios/validar-token", autenticarToken, (req, res) => {
    return res.status(200).json({ user: req.usuario });
})
routes.post("/usuarios/login/", UsuarioController.loginUsuario)
routes.post("/usuarios/register/", UsuarioController.postUsuario)
// routes.put("/usuarios/:id", UsuarioController.putPedido)
// routes.delete("/usuarios/:id", UsuarioController.deletePedido)

export default routes