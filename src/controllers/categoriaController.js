import NaoEncontrado from "../erros/NaoEncontrado.js";
import { categoria } from "../models/index.js";

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
                next(new NaoEncontrado(`Id da Categoria não localizado!`))
            }

        } catch (error) {
            next(error)
        }

    }

    static async getCategoriaFiltro(req, res, next) {
        
        try {
            const nome = req.query.nome

            const categoriaEncontrada = await categoria.find({
                nome: nome
            })

            if (categoriaEncontrada.length > 0) {
                res.status(200).send({message: "Categoria encontrada!", categoriaEncontrada});
            } else {
                next(new NaoEncontrado(`Id da Categoria não localizado!`))
            }

        } catch (error) {
            next(error)
        }

    }

    static async postCategorias(req, res, next) {

        try {
            const novaCategoria = await categoria.create(req.body)
            res.status(201).json({ message: 'Cadastrado com sucesso!', categoria: novaCategoria })
        } catch (error) {
            next(error);
        }
    }

    static async putCategoria(req, res, next) {

        try {
            const id = req.params.id
            const categoriaAtualizada = await categoria.findByIdAndUpdate(id, req.body)

            if (categoriaAtualizada !== null) {
                res.status(200).json({ message: "Categoria atualizada!" })
            } else {
                next(new NaoEncontrado('Id da categoria não localizado'))
            }

        } catch (error) {
            next(error);
        }

    }

    static async deleteCategoria(req, res, next) {

        try {
            const id = req.params.id
            const categoriaApagada = await categoria.findByIdAndDelete(id)

            if(categoriaApagada !== null){
                res.status(200).json({ message: "Categoria excluída!" })
            }else {
                next(new NaoEncontrado('Id da categoria não localizado'))
            }
            
        } catch (error) {
            next(error);
        }

    }

}

export default CategoriaController;