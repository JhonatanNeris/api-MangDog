import { cliente } from "../models/index.js"

class ClienteController {
    static async postCliente(req, res, next) {

        const newClient = req.body;

        try {

            const client = await cliente.create(newClient)

            res.status(201).json({ message: 'Cliente registrado com sucesso', client });
        } catch (error) {
            console.log(error)
            next(error);
        }
    }

    static async getClientes(req, res, next) {

        try {
            const ClientList = await cliente.find({})
            res.status(200).json(ClientList);
        } catch (error) {
            next(error);
        }
    }

}

export default ClienteController