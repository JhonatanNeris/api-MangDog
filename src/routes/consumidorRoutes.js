//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
// import UsuarioController from '../controllers/usuarioController.js'
// import autenticarToken from '../middlewares/autenticarToken.js'
// import cliente from '../models/Cliente.js'

import ConsumidorController from '../controllers/consumidorController.js'
import { autenticarConsumidor } from '../middlewares/autenticarTokenConsumidor.js'
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.post("/consumidor/register", ConsumidorController.postConsumidor)
routes.post("/consumidor/login", ConsumidorController.loginConsumidor)
routes.get("/consumidor/validar-token", autenticarConsumidor, (req, res) => {
    return res.status(200).json(req.consumidor);
})
routes.get("/consumidor/pedidos/", autenticarConsumidor, ConsumidorController.getPedidos)
routes.get("/consumidor/pedidos/:id", autenticarConsumidor, ConsumidorController.getPedidoId)
routes.get("/consumidor-por-telefone", autenticarToken, ConsumidorController.getConsumidorPorTelefone)

export default routes