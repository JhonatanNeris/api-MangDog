//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import CategoriaController from '../controllers/categoriaController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'
import adicionarClienteId from '../middlewares/adicionarClienteId.js'

const routes = express.Router()

routes.get("/menu/categorias", autenticarToken, adicionarClienteId, CategoriaController.getCategorias)
// routes.get("/menu/categorias/busca", autenticarToken, adicionarClienteId, CategoriaController.getCategoriaFiltro)
routes.get("/menu/categorias/:id", autenticarToken, adicionarClienteId, CategoriaController.getCategoriaId)
routes.post("/menu/categorias", autenticarToken, adicionarClienteId, CategoriaController.postCategorias)
routes.put("/menu/categorias/:id", autenticarToken, adicionarClienteId, CategoriaController.putCategoria)
routes.delete("/menu/categorias/:id", autenticarToken, adicionarClienteId, CategoriaController.deleteCategoria)

export default routes