import { usuario } from "../models/index.js"
import NaoEncontrado from "../erros/NaoEncontrado.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
      });

      await user.save();

      res.status(201).json({ message: 'Usuário registrado com sucesso', user });
    } catch (error) {
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
        // Gerar token JWT
        const token = jwt.sign(
          {
            id: usuarioEncontrado._id,
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email,
            permissao: usuarioEncontrado.permissao 
          },
          JWT_SECRET,
          { expiresIn: '4h' } // Token expira em 1 hora
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
      const listarUsuarios = await usuario.find({})
      res.status(200).json(listarUsuarios);
    } catch (error) {
      next(error);
    }
  }

}

export default UsuarioController