import { FastifyInstance } from "fastify";
import path from "path";
import fs from "fs";
import multipart from "@fastify/multipart";
import { promisify } from "util";
import { pipeline } from "stream";

const pipelineAsync = promisify(pipeline);

const AVATAR_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR);

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

export default async function avatarRoutes(app: FastifyInstance) {
  // On s’assure que multipart est enregistré
  app.register(multipart, { 
    limits: { fileSize: MAX_SIZE }
  });

  app.post('/upload-avatar', async (req, reply) => {
    const file = await req.file();

    if (!file) {
      return reply.code(400).send({ error: "Aucun fichier reçu !" });
    }

    // Taille maximum (multi-part gère l'arrêt, mais on vérifie)
    if (file.file.truncated) {
      return reply.code(400).send({ error: "Fichier trop volumineux (max 3Mo) !" });
    }

    // Contrôle du format
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return reply.code(400).send({ error: "Formats acceptés : JPEG, PNG, WEBP." });
    }

    const safeFilename = `${Date.now()}_${file.filename.replace(/\s+/g, "_")}`;
    const filePath = path.join(AVATAR_DIR, safeFilename);

    try {
      await pipelineAsync(file.file, fs.createWriteStream(filePath));
      reply.send({
        success: true,
        message: "Fichier uploadé !",
        fileName: safeFilename,
        url: `/avatars/${safeFilename}`,
      });
    } catch (e) {
      reply.code(500).send({ error: "Erreur serveur lors de la sauvegarde." });
    }
  });
}
