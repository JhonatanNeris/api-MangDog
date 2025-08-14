//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import ImpressaoController from '../controllers/impressaoController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'
import { authImpressao } from '../middlewares/autenticarTokenImpressao.js'

const routes = express.Router()

routes.post("/impressao/gerar-token", autenticarToken, ImpressaoController.criarTokenImpressao);
routes.post("/impressao/revogar-token", autenticarToken, ImpressaoController.revogarTokenImpressao);
routes.get("/impressao/status-token", autenticarToken, ImpressaoController.statusTokenImpressao);
routes.get("/impressao", authImpressao, ImpressaoController.getPedidosImpressao);
routes.post("/impressao/:id/ack", authImpressao, ImpressaoController.ackPedidoImpressao);

routes.post("/impressao/:id/enfileirar", autenticarToken, ImpressaoController.enfileirarImpressao);

export default routes