import cookieParser from "cookie-parser"
import "dotenv/config"
import express, { json, urlencoded } from "express"
import fs from "fs"
import helmet from "helmet"
import logger from "morgan"
import { dirname } from "path"
import { fileURLToPath } from "url"
import hls from "./hls/index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
let port = 3002
const app = express()
app.use(helmet())
app.use(logger("dev"))
app.use(json())
app.use(urlencoded({ extended: false }))
app.use(cookieParser())

app.use("/", async (req, res) => {
    res.status(404).json({ status: 404 })
})

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    console.error(err.message, err.stack)
    res.status(statusCode).json({ message: err.message })
    return
})
const server = app.listen(port, () => console.log(`Example app listening on port ${port} in ${process.env.ENV} environment`))

// HLS
new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split(".").pop()
            if (ext !== "m3u8" && ext !== "ts") {
                return cb(null, true)
            }

            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log("File not exist")
                    return cb(null, false)
                }
                cb(null, true)
            })
        },
        getManifestStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url)
            cb(null, stream)
        },
        getSegmentStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url)
            cb(null, stream)
        },
    },
})
