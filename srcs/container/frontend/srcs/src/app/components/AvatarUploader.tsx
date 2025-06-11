import React, { useRef, useState } from "react";
import ApiService from "../../api/ApiService"; // Mets le bon chemin selon ton projet

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo

const AvatarUploader: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setSuccess(null);
        setAvatarUrl(null);

        const file = e.target.files?.[0] || null;
        if (!file) {
            setSelectedFile(null);
            setPreview(null);
            return;
        }

        // Vérifie format
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Seuls JPEG, PNG ou WEBP acceptés.");
            setSelectedFile(null);
            setPreview(null);
            return;
        }
        // Vérifie taille
        if (file.size > MAX_SIZE) {
            setError("Fichier trop volumineux (3Mo max)");
            setSelectedFile(null);
            setPreview(null);
            return;
        }
        setSelectedFile(file);

        // Prévisualisation
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append("file", selectedFile); // Doit correspondre à ce que Fastify attend

        try {
            const res = await ApiService.uploadFile("/upload-avatar", formData);
            setUploading(false);

            if (res.error) {
                setError(res.error);
                return;
            }

            setSuccess("Avatar uploadé !");
            setAvatarUrl(`${ApiService["url"]}${res.url}`); // url de fichier retournée par backend
        } catch (err: any) {
            setUploading(false);
            setError("Erreur lors de l'envoi.");
        }
    };

    return (
        <div className="max-w-xs mx-auto p-6 space-y-4 border rounded-xl shadow bg-base-200">
            <h2 className="font-bold text-xl mb-2">Uploader un avatar</h2>
            {preview && (
                <img
                    src={preview}
                    className="w-32 h-32 mb-2 object-cover rounded-full ring-2 ring-primary mx-auto"
                    alt="preview"
                />
            )}

            <input
                ref={fileInput}
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                className="file-input file-input-bordered w-full"
                onChange={handleFileChange}
                disabled={uploading}
            />

            <button
                className="btn btn-primary w-full"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
            >
                {uploading ? (
                    <span className="loading loading-dots loading-sm"></span>
                ) : "Envoyer"}
            </button>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {avatarUrl && (
                <div className="mt-4 flex flex-col items-center">
                    <p className="text-sm text-neutral">Image finale :</p>
                    <img
                        src={avatarUrl}
                        alt="Votre avatar"
                        className="w-32 h-32 rounded-full object-cover shadow ring-2 ring-success"
                    />
                    <a
                        href={avatarUrl}
                        className="link-primary break-all text-xs mt-2"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{avatarUrl}</a>
                </div>
            )}
        </div>
    );
};

export default AvatarUploader;
