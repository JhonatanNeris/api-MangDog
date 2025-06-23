import { consumidor } from "../models/index.js";
import bcrypt from 'bcryptjs';
import NaoEncontrado from "../erros/NaoEncontrado.js";
import jwt from 'jsonwebtoken';

// Chave secreta para assinar o token (guarde isso em variáveis de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET

class ConsumidorController {
    static async postConsumidor(req, res, next) {

        const { nome, email, senha, telefone } = req.body;

        console.log("Nome:", nome)

        try {
            const hashedSenha = await bcrypt.hash(senha, 10);

            const novoConsumidor = new consumidor({
                nome,
                email,
                senha: hashedSenha,
                telefone
            });

            console.log(novoConsumidor)

            await novoConsumidor.save();

            res.status(201).json({ message: 'Consumidor registrado com sucesso' });
        } catch (error) {
            console.log(error)

            // Erro de e-mail duplicado
            if (error.code === 11000 && error.keyPattern?.email) {
                return res.status(400).json({ message: 'Este e-mail já está em uso.' });
            }
            next(error);
        }
    }

    static async loginConsumidor(req, res, next) {

        const { telefone, senha } = req.body;

        if (!telefone) {
            return res.status(400).json({ message: "O campo telefone é obrigatório" })
        }

        if (!senha) {
            return res.status(400).json({ message: "O campo senha é obrigatório" })
        }

        try {
            const consumidorEncontrado = await consumidor.findOne({ telefone: telefone })

            if (!consumidorEncontrado) {
                return next(new NaoEncontrado(`Consumidor não localizado!`))
            }

            const auth = await bcrypt.compare(senha, consumidorEncontrado.senha)

            if (auth) {

                // Gerar token JWT
                const token = jwt.sign(
                    {
                        id: consumidorEncontrado._id,
                        nome: consumidorEncontrado.nome,
                        email: consumidorEncontrado.email,
                        telefone: consumidorEncontrado.telefone,
                    },
                    JWT_SECRET,
                    { expiresIn: '8h' } // Token expira em 8 hora
                );

                res.status(200).json({ message: "Usuário logado!", token })
            } else {
                res.status(400).json({ message: "Senha incorreta!", auth })
            }

        } catch (error) {
            next(error);
        }
    }
}

export default ConsumidorController