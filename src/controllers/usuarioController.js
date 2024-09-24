import { usuario } from "../models/index.js"
import bcrypt from 'bcryptjs';

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