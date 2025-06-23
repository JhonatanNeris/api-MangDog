//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
// import UsuarioController from '../controllers/usuarioController.js'
// import autenticarToken from '../middlewares/autenticarToken.js'
// import cliente from '../models/Cliente.js'

import ConsumidorController from '../controllers/consumidorController.js'
import { autenticarConsumidor } from '../middlewares/autenticarTokenConsumidor.js'

const routes = express.Router()

routes.post("/consumidor/register", ConsumidorController.postConsumidor)
routes.post("/consumidor/login", ConsumidorController.loginConsumidor)
routes.get("/consumidor/validar-token", autenticarConsumidor, (req, res) => {
    return res.status(200).json(req.consumidor);
})
// routes.post("/usuarios/register/", autenticarToken, UsuarioController.postUsuario)
// routes.put("/usuarios/:id", autenticarToken, UsuarioController.putUsuario)
// routes.delete("/usuarios/:id", autenticarToken, UsuarioController.deleteUsuario)

export default routes