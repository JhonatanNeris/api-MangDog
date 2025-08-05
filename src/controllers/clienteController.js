import { cliente, usuario } from "../models/index.js"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { bucket } from '../utils/storage.js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Chave secreta para assinar o token (guarde isso em variáveis de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET

const gerarSlug = (texto) => {
    return texto
        .toLowerCase()
        .normalize("NFD") // remove acentos
        .replace(/[\u0300-\u036f]/g, "") // remove caracteres especiais dos acentos
        .replace(/[^a-z0-9 ]/g, "") // remove caracteres especiais
        .replace(/\s+/g, "-") // substitui espaços por hífens
        .replace(/-+/g, "-") // remove múltiplos hífens
        .replace(/^-|-$/g, ""); // remove hífens no início/fim
};

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

    static async getClienteLogado(req, res, next) {
        try {
            const clienteId = req.usuario.clienteId;
            const clienteEncontrado = await cliente.findById(clienteId);

            if (!clienteEncontrado) {
                return res.status(404).json({ erro: "Cliente não encontrado." });
            }

            res.status(200).json(clienteEncontrado);
        } catch (error) {
            next(error);
        }
    }


    static async postClienteEUsuario(req, res, next) {

        try {

            const { nomeRestaurante, cnpj, telefone, plano, email, senha, nomeUsuario } = req.body;

            let slug = gerarSlug(nomeRestaurante);
            let slugExistente = await cliente.findOne({ slug });
            let contador = 1;

            while (slugExistente) {
                slug = `${gerarSlug(nomeRestaurante)}-${contador}`;
                slugExistente = await cliente.findOne({ slug });
                contador++;
            }

            // 1 - Cadastrar cliente
            const novoCliente = new cliente({
                loja: {
                    nome: nomeRestaurante,
                    slug
                },
                cnpj,
                emailContato: email,
                telefoneContato: telefone,
                plano,
                ativo: false,
            })

            const clienteSalvo = await novoCliente.save()

            // 2- cadastrar usuário

            const hashedSenha = await bcrypt.hash(senha, 10);

            const novoUsuario = new usuario({
                nome: nomeUsuario,
                email,
                senha: hashedSenha,
                permissao: "dono",
                clienteId: clienteSalvo._id
            })

            await novoUsuario.save()

            // 3 - logar usuário
            const usuarioEncontrado = await usuario.findOne({ email: email })

            // Agora, busque o nome do cliente usando o clienteId do usuário
            const token = jwt.sign(
                {
                    id: usuarioEncontrado._id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    permissao: novoUsuario.permissao,
                    clienteId: clienteSalvo._id,
                    clienteNome: nomeRestaurante,
                },
                JWT_SECRET,
                { expiresIn: '8h' } // Token expira em 8 hora
            );


            return res.status(201).json({
                message: "Cliente e usuário cadastrados com sucesso!",
                clienteId: clienteSalvo._id,
                token
            });

        } catch (error) {
            console.error("Erro ao cadastrar cliente e usuário:", error);
            next(error);
        }
    }

    static async putCliente(req, res, next) {
        try {
            const clienteId = req.usuario.clienteId;
            const body = req.body;

            console.log(clienteId)
            console.log(body)

            const update = {
                "loja.nome": body["loja.nome"],
                "loja.telefone": body["loja.telefone"],
                "loja.descricao": body["loja.descricao"],
                "loja.pedidoMinimo": body["loja.pedidoMinimo"],
                "loja.endereco.cep": body["loja.endereco.cep"],
                "loja.endereco.logradouro": body["loja.endereco.logradouro"],
                "loja.endereco.numero": body["loja.endereco.numero"],
                "loja.endereco.complemento": body["loja.endereco.complemento"],
                "loja.endereco.bairro": body["loja.endereco.bairro"],
                "loja.endereco.cidade": body["loja.endereco.cidade"],
                "loja.endereco.estado": body["loja.endereco.estado"],
            };

            const latitudeStr = body["loja.endereco.latitude"];
            const longitudeStr = body["loja.endereco.longitude"];

            if (
                latitudeStr &&
                longitudeStr &&
                !isNaN(parseFloat(latitudeStr)) &&
                !isNaN(parseFloat(longitudeStr))
            ) {
                update["loja.endereco.coordenadas"] = {
                    latitude: parseFloat(latitudeStr),
                    longitude: parseFloat(longitudeStr),
                };
            }


            let imagemUrl = null;

            if (req.file) {
                // const extensao = req.file.originalname.split('.').pop();
                const nomeArquivo = `clientes/${req.usuario.clienteId}/logo/${uuidv4()}.webp`;

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
                update["loja.logoUrl"] = imagemUrl;

            }

            console.log(update)

            await cliente.findByIdAndUpdate(clienteId, { $set: update });

            res.status(200).json({ message: "Cliente atualizado com sucesso!" });
        } catch (error) {
            next(error);
        }
    }


}

export default ClienteController