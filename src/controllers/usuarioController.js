import { usuario } from "../models/index.js"
import NaoEncontrado from "../erros/NaoEncontrado.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cliente from "../models/Cliente.js";

// Chave secreta para assinar o token (guarde isso em variáveis de ambiente em produção)
const JWT_SECRET = process.env.JWT_SECRET

class UsuarioController {

  static async postUsuario(req, res, next) {

    const { nome, email, senha, permissao } = req.body;

    try {
      const hashedSenha = await bcrypt.hash(senha, 10);

      const user = new usuario({
        nome,
        email,
        senha: hashedSenha,
        permissao,
        clienteId: req.usuario.clienteId
      });

      await user.save();

      res.status(201).json({ message: 'Usuário registrado com sucesso', user });
    } catch (error) {

      // Erro de e-mail duplicado
      if (error.code === 11000 && error.keyPattern?.email) {
        return res.status(400).json({ message: 'Este e-mail já está em uso.' });
      }
      next(error);
    }
  }

  static async loginUsuario(req, res, next) {

    const { email, senha } = req.body;

    if (!email) {
      return res.status(400).json({ message: "O campo email é obrigatório" })
    }

    if (!senha) {
      return res.status(400).json({ message: "O campo senha é obrigatório" })
    }

    try {
      const usuarioEncontrado = await usuario.findOne({ email: email })

      if (!usuarioEncontrado) {
        return next(new NaoEncontrado(`Usuário não localizado!`))
      }

      const auth = await bcrypt.compare(senha, usuarioEncontrado.senha)

      if (auth) {

        // Agora, busque o nome do cliente usando o clienteId do usuário
        const clienteEncontrado = await cliente.findById(usuarioEncontrado.clienteId);

        if (!clienteEncontrado) {
          return res.status(404).json({ message: 'Cliente não encontrado!' });
        }

        // Adicione o nome do cliente ao objeto usuario
        const clienteNome = clienteEncontrado.nome;

        // Gerar token JWT
        const token = jwt.sign(
          {
            id: usuarioEncontrado._id,
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email,
            permissao: usuarioEncontrado.permissao,
            clienteId: usuarioEncontrado.clienteId,
            clienteNome: clienteNome,
            clienteEmail: clienteEncontrado.emailContato
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

  static async getUsuarios(req, res, next) {

    try {
      const listarUsuarios = await usuario.find({ clienteId: req.usuario.clienteId })
      res.status(200).json(listarUsuarios);
    } catch (error) {
      next(error);
    }
  }

  static async putUsuario(req, res, next) {

    try {
      const id = req.params.id

      await usuario.findOneAndUpdate({ _id: id, clienteId: req.usuario.clienteId }, req.body)
      res.status(200).json({ message: "Usuário atualizado com sucesso!" })
    } catch (error) {
      next(error);
    }

  }

  static async deleteUsuario(req, res, next) {

    try {
      const id = req.params.id
      const usuarioDeletado = await usuario.findOneAndDelete({
        _id: id,
        clienteId: req.usuario.clienteId
      })

      if (usuarioDeletado !== null) {
        res.status(200).json({ message: "Usuário excluído!" })
      } else {
        next(new NaoEncontrado('Id do usuário não localizado'))
      }

    } catch (error) {
      next(error);
    }

  }

}

export default UsuarioController