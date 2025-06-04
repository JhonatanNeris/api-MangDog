import { cliente, usuario } from "../models/index.js"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Chave secreta para assinar o token (guarde isso em variáveis de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET

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

    static async postClienteEUsuario(req, res, next) {

        try {

            const { nomeRestaurante, cnpj, telefone, plano, email, senha, nomeUsuario } = req.body;

            // 1 - Cadastrar cliente
            const novoCliente = new cliente({
                nome: nomeRestaurante,
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

}

export default ClienteController