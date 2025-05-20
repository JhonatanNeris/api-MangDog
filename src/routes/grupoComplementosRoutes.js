//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import GrupoComplementosController from '../controllers/grupoComplementosController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/menu/grupoComplementos", autenticarToken, GrupoComplementosController.getGrupoComplementos)
routes.get("/menu/grupoComplementosPorIds", autenticarToken, GrupoComplementosController.getGrupoComplementosPorIds);
routes.get("/menu/grupoComplementos/:id", autenticarToken, GrupoComplementosController.getGrupoComplementosId)
routes.post("/menu/grupoComplementos", autenticarToken, GrupoComplementosController.postGrupoComplementos)
routes.put("/menu/grupoComplementos/:id", autenticarToken, GrupoComplementosController.putGrupoComplementos)
routes.delete("/menu/grupoComplementos/:id", autenticarToken, GrupoComplementosController.deleteGrupoComplementos)

export default routes