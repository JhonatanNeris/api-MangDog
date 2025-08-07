//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import AreaEntregaController from '../controllers/areaEntregaController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/areas-entrega", autenticarToken, AreaEntregaController.listarAreasEntrega)
routes.get("/areas-entrega/:id", autenticarToken, AreaEntregaController.listarAreaEntregaPorId)
routes.post("/areas-entrega", autenticarToken,  AreaEntregaController.postAreaEntrega)
routes.put("/areas-entrega/:id", autenticarToken,  AreaEntregaController.putAreaEntrega)
routes.delete("/areas-entrega/:id", autenticarToken,  AreaEntregaController.deleteAreaEntrega)

export default routes