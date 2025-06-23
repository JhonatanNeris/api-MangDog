//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import ProdutoController from '../controllers/produtoController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/menu/produtos", autenticarToken, ProdutoController.getProdutos)
routes.get("/menu/produtos-completos", autenticarToken, ProdutoController.getProdutosComGruposComplementos)
routes.get("/menu/produtos/:id", autenticarToken, ProdutoController.getProdutoId)
routes.post("/menu/produtos", autenticarToken, ProdutoController.postProdutos)
routes.put("/menu/produtos/:id", autenticarToken, ProdutoController.putProduto)
routes.delete("/menu/produtos/:id", autenticarToken, ProdutoController.deleteProduto)
// routes.get("/menu/cardapio/:slug", ProdutoController.getCardapio)

export default routes