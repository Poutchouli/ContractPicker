/**
 * Module de stéganographie
 * Ce module permet de cacher des données dans des images et de les extraire
 */
import { logInfo, logError } from './logger.js';

/**
 * Cache des données dans une image
 * @param {HTMLCanvasElement|Image} image - Image ou canvas source
 * @param {string} data - Données à cacher
 * @param {Function} callback - Fonction de rappel avec l'URL de données de l'image résultante
 */
export function hideStegInImg(image, data, callback) {
    try {
        // Créer un canvas si l'image n'en est pas un
        let canvas = image;
        if (!(image instanceof HTMLCanvasElement)) {
            canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
        }
        
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        
        // Convertir les données en binaire (8 bits par caractère)
        const binaryData = textToBinary(data);
        
        // Vérifier si l'image est assez grande pour contenir les données
        if (binaryData.length > pixels.length / 4 * 3) {
            logError('L\'image est trop petite pour contenir toutes les données');
            callback(null);
            return;
        }
        
        // Stocker la longueur des données binaires dans les 32 premiers pixels
        const dataLengthBinary = (binaryData.length).toString(2).padStart(32, '0');
        
        for (let i = 0; i < 32; i++) {
            const pixelIndex = i * 4;
            
            // Modifier le dernier bit du canal rouge
            pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | parseInt(dataLengthBinary[i]);
            
            // Marquer ces pixels avec une légère teinte pour indiquer un header
            pixels[pixelIndex + 1] = Math.max(0, pixels[pixelIndex + 1] - 1); // Canal vert
        }
        
        // Cacher les données
        let dataIndex = 0;
        for (let i = 32; i < pixels.length / 4 && dataIndex < binaryData.length; i++) {
            const pixelIndex = i * 4;
            
            // Modifier les derniers bits de chaque canal RGB
            if (dataIndex < binaryData.length) {
                pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | parseInt(binaryData[dataIndex]);
                dataIndex++;
            }
            
            if (dataIndex < binaryData.length) {
                pixels[pixelIndex + 1] = (pixels[pixelIndex + 1] & 0xFE) | parseInt(binaryData[dataIndex]);
                dataIndex++;
            }
            
            if (dataIndex < binaryData.length) {
                pixels[pixelIndex + 2] = (pixels[pixelIndex + 2] & 0xFE) | parseInt(binaryData[dataIndex]);
                dataIndex++;
            }
            
            // Le canal alpha (pixels[pixelIndex + 3]) est laissé inchangé
        }
        
        // Mettre à jour l'image
        ctx.putImageData(imgData, 0, 0);
        
        // Convertir le canvas en URL de données
        const dataURL = canvas.toDataURL('image/png');
        
        logInfo('Données cachées avec succès dans l\'image');
        callback(dataURL);
    } catch (e) {
        logError('Erreur lors de la dissimulation des données:', e);
        callback(null);
    }
}

/**
 * Extrait des données cachées d'une image
 * @param {Image} image - Image source
 * @param {Function} callback - Fonction de rappel avec les données extraites
 */
export function revealStegFromImg(image, callback) {
    try {
        // Créer un canvas pour l'image
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        
        // Extraire la longueur des données binaires
        let dataLengthBinary = '';
        for (let i = 0; i < 32; i++) {
            const pixelIndex = i * 4;
            dataLengthBinary += (pixels[pixelIndex] & 1).toString();
        }
        
        const dataLength = parseInt(dataLengthBinary, 2);
        
        // Extraire les données binaires
        let extractedBinary = '';
        let dataIndex = 0;
        
        for (let i = 32; i < pixels.length / 4 && dataIndex < dataLength; i++) {
            const pixelIndex = i * 4;
            
            if (dataIndex < dataLength) {
                extractedBinary += (pixels[pixelIndex] & 1).toString();
                dataIndex++;
            }
            
            if (dataIndex < dataLength) {
                extractedBinary += (pixels[pixelIndex + 1] & 1).toString();
                dataIndex++;
            }
            
            if (dataIndex < dataLength) {
                extractedBinary += (pixels[pixelIndex + 2] & 1).toString();
                dataIndex++;
            }
        }
        
        // Convertir les données binaires en texte
        const extractedText = binaryToText(extractedBinary.substring(0, dataLength));
        
        logInfo('Données extraites avec succès de l\'image');
        callback(extractedText);
    } catch (e) {
        logError('Erreur lors de l\'extraction des données:', e);
        callback(null);
    }
}

/**
 * Convertit du texte en binaire
 * @param {string} text - Texte à convertir
 * @returns {string} - Représentation binaire du texte
 */
function textToBinary(text) {
    let binary = '';
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        binary += charCode.toString(2).padStart(8, '0');
    }
    return binary;
}

/**
 * Convertit du binaire en texte
 * @param {string} binary - Représentation binaire
 * @returns {string} - Texte
 */
function binaryToText(binary) {
    let text = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        const charCode = parseInt(byte, 2);
        text += String.fromCharCode(charCode);
    }
    return text;
}
