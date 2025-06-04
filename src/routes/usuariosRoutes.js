//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import UsuarioController from '../controllers/usuarioController.js'
import autenticarToken from '../middlewares/autenticarToken.js'
import cliente from '../models/Cliente.js'

const routes = express.Router()

routes.get("/usuarios/", autenticarToken, UsuarioController.getUsuarios)
routes.get("/usuarios/validar-token", autenticarToken, (req, res) => {
    return res.status(200).json({ user: req.usuario, clienteNome: req.usuario.clienteNome });
})
routes.post("/usuarios/login/", UsuarioController.loginUsuario)
routes.post("/usuarios/register/", autenticarToken, UsuarioController.postUsuario)
routes.put("/usuarios/:id", autenticarToken, UsuarioController.putUsuario)
routes.delete("/usuarios/:id", autenticarToken, UsuarioController.deleteUsuario)

export default routes