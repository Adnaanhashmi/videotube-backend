import multer from "multer";
import path from "path"
import { fileURLToPath } from 'url';

const filePath = fileURLToPath(import.meta.url);
const dirname = path.dirname(filePath);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(dirname, '../../public/temp'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

export default upload