import { categoria } from '../models/Categoria.js';
import { produto } from '../models/Produto.js'

class ProdutoController {

    static async getProdutos(req, res, next) {

        try {
            const listaProdutos = await produto.find({})
            res.status(200).json(listaProdutos)
        } catch (error) {
            next(error);
        }

    }

    static async getProdutoId(req, res, next) {

        try {
            const id = req.params.id
            const produtoEncontrado = await produto.findById(id)
            res.status(200).json(produtoEncontrado)
        } catch (error) {
            next(error);
        }

    }

    static async postProdutos(req, res, next) {

        const novoProduto = req.body

        try {
            const categoriaEncontrada = await categoria.findById(novoProduto.categoria)
            const produtoCompleto = { ...novoProduto, categoria: { ...categoriaEncontrada._doc } }

            const produtoCriado = await produto.create(produtoCompleto)
            res.status(201).json({ message: 'Cadastrado com sucesso!', produto: produtoCriado })
        } catch (error) {
            next(error);
        }
    }

    static async putProduto(req, res, next) {

        try {
            const id = req.params.id
            await produto.findByIdAndUpdate(id, req.body)
            res.status(200).json({ message: "Produto atualizado!" })
        } catch (error) {
            next(error);
        }

    }

    static async deleteProduto(req, res, next) {

        try {
            const id = req.params.id
            await produto.findByIdAndDelete(id)
            res.status(200).json({ message: "Produto excluído!" })
        } catch (error) {
            next(error);
        }

    }

}

export default ProdutoController;