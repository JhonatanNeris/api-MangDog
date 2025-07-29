//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import ProdutoController from '../controllers/produtoController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'
import upload from '../middlewares/uploadImage.js'

const routes = express.Router()

routes.get("/menu/produtos", autenticarToken, ProdutoController.getProdutos)
routes.get("/menu/produtos-completos", autenticarToken, ProdutoController.getProdutosComGruposComplementos)
routes.get("/menu/produtos/:id", autenticarToken, ProdutoController.getProdutoId)
routes.get("/menu/cardapio", autenticarToken, ProdutoController.getCardapio)
routes.post("/menu/produtos", autenticarToken, upload.single("imagem"), ProdutoController.postProdutoComImagem)
routes.put("/menu/produtos/:id", autenticarToken, upload.single("imagem"), ProdutoController.putProduto)
routes.delete("/menu/produtos/:id", autenticarToken, ProdutoController.deleteProduto)
routes.post("/menu/produtos/upload-image", autenticarToken, ProdutoController.uploadImageProduto)

export default routes