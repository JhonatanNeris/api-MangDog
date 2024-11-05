//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import DesempenhoController from '../controllers/desempenhoController.js'

//MIDDLEWARES
// import paginar from '../middlewares/paginar.js'
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/desempenho/", autenticarToken, DesempenhoController.getDesempenho)
routes.get("/desempenho/diario", autenticarToken, DesempenhoController.getDesempenhoDiario)
routes.get("/desempenho/periodo", autenticarToken, DesempenhoController.getDesempenhoPorPeriodo)

export default routes