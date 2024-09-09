//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import CategoriaController from '../controllers/categoriaController.js'

const routes = express.Router()

routes.get("/menu/categorias", CategoriaController.getCategorias)
routes.get("/menu/categorias/:id", CategoriaController.getCategoriaId)
routes.post("/menu/categorias", CategoriaController.postCategorias)
routes.put("/menu/categorias/:id", CategoriaController.putCategoria)
routes.delete("/menu/categorias/:id", CategoriaController.deleteCategoria)

export default routes