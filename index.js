const express = require("express");
const app = express();
const cors = require("cors");
const expressSession = require("express-session");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const dotenv = require("dotenv");
const path = require("path");
const db_config = require("./models/db");
const conn = db_config.init();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

const front_api_Router = require("./routes/api/front_api");

const helmet = require("helmet");
const http = require("http");
const https = require("https");
const fs = require("fs");
const moment = require('moment');
const { logger, error_logger } = require('./loger');



app.use(morgan(`log_${moment().format("YYYY-MM-DD")}`)); //요청에대한 로그가 남음
app.use("/upload", express.static("upload"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("Front"));
app.use(helmet());
app.disable("x-powered-by"); //x-powerd-by 헤더속에는 사용중인 서버관련 소프트웨어 포함 삭제를 해야함
dotenv.config();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);



// const express = require('express');
// const cors = require('cors');
let corsOption = {
    origin: true, // 허락하는 요청 주소
    credentials: true // true로 하면 설정한 내용을 response 헤더에 추가 해줍니다.
}
app.use(cors(corsOption)); // CORS 미들웨어 추가




const corsOptions = {
    //origin: 'http://127.0.0.1:9001',
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use("/api/front_api", cors(corsOptions), front_api_Router);



//app.use(express.static(path.join(__dirname, '../front/build')));
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With');
    next();
});



app.listen(process.env.DEV_SERVER_PORT, () => {
  logger.info('server 8082 start')
  console.log(`port ${process.env.DEV_SERVER_PORT} server start`);
});


