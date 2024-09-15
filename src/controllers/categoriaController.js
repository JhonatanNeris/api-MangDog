import { categoria } from "../models/Categoria.js";

class CategoriaController {

    static async getCategorias(req, res, next) {

        try {
            const listaCategorias = await categoria.find({})
            res.status(200).json(listaCategorias);
        } catch (error) {
            next(error);
        }

    }

    static async getCategoriaId(req, res, next) {

        try {
            const id = req.params.id
            const categoriaEncontrada = await categoria.findById(id)

            if (categoriaEncontrada !== null) {
                res.status(200).send(categoriaEncontrada);
            } else {
                res.status(404).send({ message: `Id da Categoria não localizado!` });
            }

        } catch (error) {
            next(error)
        }

    }

    static async postCategorias(req, res) {

        try {
            const novaCategoria = await categoria.create(req.body)
            res.status(201).json({ message: 'Cadastrado com sucesso!', categoria: novaCategoria })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha ao cadastrar categoria!` });
        }
    }

    static async putCategoria(req, res) {

        try {
            const id = req.params.id
            await categoria.findByIdAndUpdate(id, req.body)
            res.status(200).json({ message: "Categoria atualizada!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na requisição da categoria!` });
        }

    }

    static async deleteCategoria(req, res) {

        try {
            const id = req.params.id
            await categoria.findByIdAndDelete(id)
            res.status(200).json({ message: "Categoria excluída!" })
        } catch (error) {
            res.status(500).json({ message: `${error.message} - Falha na exclusão da categoria!` });
        }

    }

}

export default CategoriaController;