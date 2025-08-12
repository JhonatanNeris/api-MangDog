//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import EntregadorController from '../controllers/entregadorController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/entregadores/resumo", autenticarToken, EntregadorController.getResumoEntregadores)
routes.get("/entregadores", autenticarToken, EntregadorController.listarEntregadores)
routes.get("/entregadores/:id", autenticarToken, EntregadorController.listarEntregadorPorId)
routes.post("/entregadores", autenticarToken,  EntregadorController.postEntregador)
routes.put("/entregadores/:id", autenticarToken,  EntregadorController.putEntregador)
routes.delete("/entregadores/:id", autenticarToken,  EntregadorController.deleteEntregador)

export default routes
