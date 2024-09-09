//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import ProdutoController from '../controllers/produtoController.js'

const routes = express.Router()

routes.get("/menu/produtos", ProdutoController.getProdutos)
routes.get("/menu/produtos/:id", ProdutoController.getProdutoId)
routes.post("/menu/produtos", ProdutoController.postProdutos)
routes.put("/menu/produtos/:id", ProdutoController.putProduto)
routes.delete("/menu/produtos/:id", ProdutoController.deleteProduto)

export default routes