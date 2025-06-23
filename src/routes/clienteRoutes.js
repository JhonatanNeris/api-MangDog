//IMPORT DO EXPRESS QUE É RESPONSÁVEL PELAS ROTAS
import express from 'express'

//CONTROLLER
import clienteController from '../controllers/clienteController.js'

const routes = express.Router()

routes.get("/clientes/", clienteController.getClientes)
routes.post("/clientes/register/", clienteController.postClienteEUsuario)
routes.put("/clientes/:id", clienteController.putCliente)
// routes.get("/usuarios/validar-token", autenticarToken, (req, res) => {
    // return res.status(200).json({ user: req.usuario });
// })
// routes.post("/clientes/register/", clienteController.postCliente)
// routes.post("/usuarios/register/", UsuarioController.postUsuario)
// routes.delete("/usuarios/:id", UsuarioController.deletePedido)

export default routes