import { categoria, cliente, produto } from '../models/index.js';
import { bucket } from '../utils/storage.js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

class ProdutoController {

    static async getProdutos(req, res, next) {

        try {
            const listaProdutos = await produto.find({ clienteId: req.usuario.clienteId })
            res.status(200).json(listaProdutos)
        } catch (error) {
            next(error);
        }

    }

    static async getProdutosComGruposComplementos(req, res, next) {

        try {
            const listaProdutos = await produto.find({ clienteId: req.usuario.clienteId })
                .collation({ locale: 'pt', strength: 1 })
                .sort({ nome: 1 })
                .populate({ path: 'grupoComplementos', populate: { path: 'complementos' } })
                .lean();

            // injeta grupoId em cada complemento
            const produtosCompletos = listaProdutos.map((p) => ({
                ...p,
                grupoComplementos: (p.grupoComplementos ?? []).map((g) => ({
                    ...g,
                    complementos: (g.complementos ?? []).map((c) => ({
                        ...c,
                        grupoId: g._id.toString(),
                    })),
                })),
            }));


            res.status(200).json(produtosCompletos)
        } catch (error) {
            next(error);
        }

    }

    static async getCardapio(req, res, next) {

        try {
            const id = req.usuario.clienteId

            // Buscar cliente pelo slug
            // const clienteEncontrado = await cliente.findOne({ slug });

            if (!id) {
                throw new Error("Cliente não encontrado");
            }

            const listaCategorias = await categoria.find({ clienteId: id })

            const listaProdutos = await produto.find({ clienteId: id }).populate({ path: 'grupoComplementos', populate: { path: 'complementos' } })

            console.log(listaProdutos)

            // Agrupar produtos por categoria
            const cardapio = listaCategorias.map((cat) => {
                const produtosDaCategoria = listaProdutos.filter(
                    (produto) => produto.categoria._id?.toString() === cat._id.toString()
                );

                return {
                    _id: cat._id,
                    nomeCategoria: cat.nome,
                    produtos: produtosDaCategoria,
                };
            });


            console.log(cardapio)
            res.status(200).json(cardapio)
        } catch (error) {
            next(error);
        }



    }

    static async getProdutoId(req, res, next) {

        try {
            const id = req.params.id
            const produtoEncontrado = await produto.findOne({
                _id: id,
                clienteId: req.usuario.clienteId
            })
            res.status(200).json(produtoEncontrado)
        } catch (error) {
            next(error);
        }

    }

    static async postProdutos(req, res, next) {

        const { categoria: categoriaId, controlaEstoque, quantidadeEstoque, ...dadosProduto } = req.body

        try {
            const categoriaEncontrada = await categoria.findById(categoriaId)
            const produtoCompleto = {
                ...dadosProduto,
                categoria: { ...categoriaEncontrada._doc },
                clienteId: req.usuario.clienteId,
                controlaEstoque: controlaEstoque === true || controlaEstoque === 'true',
                quantidadeEstoque: Number(quantidadeEstoque) || 0
            }

            const produtoCriado = await produto.create(produtoCompleto)
            res.status(201).json({ message: 'Cadastrado com sucesso!', produto: produtoCriado })
        } catch (error) {
            next(error);
        }
    }

    static async postProdutoComImagem(req, res, next) {

        try {
            const {
                nome,
                descricao,
                preco,
                categoria: categoriaId,
                grupoComplementos,
                controlaEstoque,
                quantidadeEstoque,
            } = req.body;

            const precoConvertido = parseFloat(preco);
            const grupoComplementosArray = grupoComplementos ? JSON.parse(grupoComplementos) : [];

            const categoriaEncontrada = await categoria.findById(categoriaId);

            let imagemUrl = null;

            if (req.file) {
                // const extensao = req.file.originalname.split('.').pop();
                const nomeArquivo = `clientes/${req.usuario.clienteId}/produtos/${uuidv4()}.webp`;

                const imagemProcessada = await sharp(req.file.buffer)
                    .rotate()
                    .resize(800, 800) // largura máxima
                    .webp({ quality: 90 }) // compressão .webp com qualidade razoável
                    .toBuffer();

                const blob = bucket.file(nomeArquivo);
                try {
                    await new Promise((resolve, reject) => {
                        const stream = blob.createWriteStream({
                            resumable: false,
                            contentType: req.file.mimetype,
                            // public: true,
                            metadata: {
                                cacheControl: 'public, max-age=31536000',
                            },
                        });

                        stream.on('error', (err) => {
                            console.error('Erro no upload da imagem:', err);
                            reject(err);
                        });

                        stream.on('finish', () => {
                            console.log('Upload finalizado com sucesso!');
                            resolve();
                        });

                        stream.end(imagemProcessada);
                    });
                } catch (err) {
                    return res.status(500).json({ erro: 'Falha ao fazer upload da imagem', detalhe: err.message });
                }


                imagemUrl = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;
            }

            const novoProduto = {
                nome,
                descricao,
                preco: precoConvertido,
                categoria: categoriaEncontrada ? { ...categoriaEncontrada._doc } : null,
                grupoComplementos: grupoComplementosArray,
                clienteId: req.usuario.clienteId,
                imagemUrl,
                controlaEstoque: controlaEstoque === 'true' || controlaEstoque === true,
                quantidadeEstoque: Number(quantidadeEstoque) || 0
            };

            const produtoCriado = await produto.create(novoProduto);

            res.status(201).json({ message: 'Cadastrado com sucesso!', produto: produtoCriado });
        } catch (error) {
            next(error);
        }
    }

    static async putProduto(req, res, next) {

        try {
            const id = req.params.id;

            const {
                nome,
                descricao,
                preco,
                categoria: categoriaId,
                grupoComplementos,
                removerImagem, // opcional: enviado como string 'true' se quiser remover imagem
                disponivel,
                controlaEstoque,
                quantidadeEstoque
            } = req.body;

            const precoConvertido = parseFloat(preco);
            const grupoComplementosArray = grupoComplementos ? JSON.parse(grupoComplementos) : [];

            const categoriaEncontrada = await categoria.findById(categoriaId);
            const produtoExistente = await produto.findOne({ _id: id, clienteId: req.usuario.clienteId });

            if (!produtoExistente) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }

            let imagemUrl = produtoExistente.imagemUrl;

            // Se usuário marcou para remover a imagem
            if (removerImagem === 'true' && imagemUrl) {
                const nomeArquivo = imagemUrl.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
                await bucket.file(nomeArquivo).delete().catch(() => null);
                imagemUrl = null;
            }

            // Se foi enviada nova imagem
            if (req.file) {
                // const extensao = req.file.originalname.split('.').pop();
                // const nomeArquivo = `clientes/${req.usuario.clienteId}/produtos/${uuidv4()}.${extensao}`;
                const nomeArquivo = `clientes/${req.usuario.clienteId}/produtos/${uuidv4()}.webp`;

                const imagemProcessada = await sharp(req.file.buffer)
                    .rotate()
                    .resize(800, 800) // largura máxima
                    .webp({ quality: 90 }) // compressão .webp com qualidade razoável
                    .toBuffer();

                const blob = bucket.file(nomeArquivo);

                await new Promise((resolve, reject) => {
                    const stream = blob.createWriteStream({
                        resumable: false,
                        contentType: req.file.mimetype,
                        metadata: {
                            cacheControl: 'public, max-age=31536000',
                        },
                    });

                    stream.on('error', (err) => {
                        console.error('Erro no upload da imagem:', err);
                        reject(err);
                    });

                    stream.on('finish', () => resolve());
                    stream.end(imagemProcessada);
                });

                imagemUrl = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;
            }

            const updateData = {
                nome,
                descricao,
                preco: precoConvertido,
                categoria: categoriaEncontrada ? { ...categoriaEncontrada._doc } : null,
                grupoComplementos: grupoComplementosArray,
                imagemUrl,
                disponivel: disponivel === 'true'
            }

            if (typeof controlaEstoque !== 'undefined') {
                updateData.controlaEstoque = controlaEstoque === 'true' || controlaEstoque === true
            }

            if (typeof quantidadeEstoque !== 'undefined') {
                updateData.quantidadeEstoque = Number(quantidadeEstoque)
            }

            await produto.findOneAndUpdate(
                { _id: id, clienteId: req.usuario.clienteId },
                updateData,
            );

            res.status(200).json({ message: "Produto atualizado!" });
        } catch (error) {
            next(error);
        }

    }

    static async deleteProduto(req, res, next) {

        try {
            const id = req.params.id
            await produto.findOneAndDelete({
                _id: id,
                clienteId: req.usuario.clienteId
            })
            res.status(200).json({ message: "Produto excluído!" })
        } catch (error) {
            next(error);
        }

    }

    static async uploadImageProduto(req, res, next) {

        try {
            if (!req.file) return res.status(400).json({ erro: 'Imagem não enviada.' });

            const { restauranteId, nomeProduto } = req.body;

            const user = req.usuario

            console.log(user)

            const nomeArquivo = `restaurantes/${restauranteId}/produtos/${Date.now()}-${nomeProduto.replace(/\s/g, '-')}.jpg`;

            const blob = bucket.file(nomeArquivo);
            const blobStream = blob.createWriteStream({
                resumable: false,
                contentType: req.file.mimetype,
                public: true, // tornar público ao subir
                metadata: {
                    cacheControl: 'public, max-age=31536000', // cache de 1 ano
                },
            });

            blobStream.on('error', (err) => {
                console.error(err);
                res.status(500).json({ erro: 'Erro ao enviar imagem.' });
            });

            blobStream.on('finish', () => {
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                res.status(200).json({ url: publicUrl });
            });

            blobStream.end(req.file.buffer);
        } catch (err) {
            console.error(err);
            res.status(500).json({ erro: 'Erro interno.' });
        }

    }

}

export default ProdutoController;