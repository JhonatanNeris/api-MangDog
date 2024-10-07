//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import CategoriaController from '../controllers/categoriaController.js'

//MIDDLEWARES
import autenticarToken from '../middlewares/autenticarToken.js'

const routes = express.Router()

routes.get("/menu/categorias", autenticarToken, CategoriaController.getCategorias)
routes.get("/menu/categorias/busca", autenticarToken, CategoriaController.getCategoriaFiltro)
routes.get("/menu/categorias/:id", autenticarToken, CategoriaController.getCategoriaId)
routes.post("/menu/categorias", autenticarToken, CategoriaController.postCategorias)
routes.put("/menu/categorias/:id", autenticarToken, CategoriaController.putCategoria)
routes.delete("/menu/categorias/:id", autenticarToken, CategoriaController.deleteCategoria)

export default routes