const express = require('express');
const router = express.Router();
const db_config = require('../../models/db');
const conn = db_config.init();
const pool = db_config.pool();
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const moment = require("moment");
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // module import
const dotev = require("dotenv");
dotev.config();




router.get('/paymnts_lists', async (req, res, next) => {
    let result_status = false;

    try {
        if (!req.headers['authorization']) {
            //console.log('req.headers[\'authorization\'] -> ', req.headers['authorization']);
            return res.json({"code": '000', "desc": "auth-token missing error", "info": null});
        }
        // verify auth credentials
        const base64Credentials =  req.headers['authorization'].split(' ')[1];
        let decodedValue = jwt.verify(base64Credentials, process.env.COMM_PASSWD,);
        console.log('decodedValue.db_email ->>>>>>> ',decodedValue.db_email)
        // decodedValue -  { db_email:  'grandskywind@daum.net', iat:1616514554 }

        const sql0 = ` SELECT
                            count(*) cnt
                       FROM user
                       WHERE email = ? `;

        await new Promise(async (res, rej) => {
                await conn.query(sql0, [decodedValue.db_email], (err, rows) => {
                    if (err) rej(err);
                    else res(rows[0].cnt);
                });
            }
        ).then( (val) => {
            val > 0 ?
                result_status = true
            :
                result_status = false
            }
        ).catch(e => {
            throw new Error(e);
        })

        console.log('result_status - ', result_status);
        if (result_status){
            let {
                comp_nm_Ref_v,
                jungsan_date_Ref_v,
                total_paymnt_amnt_Ref_v,
                paymnt_method_Ref_v,
                minus_amount_Ref_v,
                jungsan_amount_Ref_v,
                use_Ref_v,
                orderBy,
                descasc
            } = req.query;

            if(!orderBy || orderBy === '') { orderBy = 'M.id'; }
            if(!descasc || descasc === '') { descasc = 'DESC'; }

            const sort = `ORDER BY ${orderBy} ${descasc}`;
            const sql = `  SELECT
                            M.id,
                            M.jungsan_date,
                            M.total_paymnt_amnt,
                            M.paymnt_method,
                            M.jungsan_amount,
                            M.minus_amount,
                            M.memo, 
                            N.comp_cd,
                            N.comp_nm,
                            N.comp_tel,
                            N.use
                       FROM paymnts M
                        LEFT OUTER JOIN comp N
                          ON M.comp_cd = N.comp_cd
                       WHERE (CASE WHEN '${comp_nm_Ref_v}' = '' THEN '' ELSE N.comp_nm END) LIKE (CASE WHEN '${comp_nm_Ref_v}' = '' THEN '' ELSE '%${comp_nm_Ref_v}%' END)
                         AND (CASE WHEN '${jungsan_date_Ref_v}' = '' THEN '' ELSE M.jungsan_date END) = (CASE WHEN '${jungsan_date_Ref_v}' = '' THEN '' ELSE '${jungsan_date_Ref_v}' END)
                         AND (CASE WHEN '${total_paymnt_amnt_Ref_v}' = '' THEN '' ELSE M.total_paymnt_amnt END) = (CASE WHEN '${total_paymnt_amnt_Ref_v}' = '' THEN '' ELSE '${total_paymnt_amnt_Ref_v}' END)
                         AND (CASE WHEN '${paymnt_method_Ref_v}' = '' THEN '' ELSE M.paymnt_method END) = (CASE WHEN '${paymnt_method_Ref_v}' = '' THEN '' ELSE '${paymnt_method_Ref_v}' END)
                         AND (CASE WHEN '${minus_amount_Ref_v}' = '' THEN '' ELSE M.minus_amount END) = (CASE WHEN '${minus_amount_Ref_v}' = '' THEN '' ELSE '${minus_amount_Ref_v}' END)
                         AND (CASE WHEN '${jungsan_amount_Ref_v}' = '' THEN '' ELSE M.jungsan_amount END) = (CASE WHEN '${jungsan_amount_Ref_v}' = '' THEN '' ELSE '${jungsan_amount_Ref_v}' END)
                         AND (CASE WHEN '${use_Ref_v}' = '' THEN '' ELSE N.use END) = (CASE WHEN '${use_Ref_v}' = '' THEN '' ELSE '${use_Ref_v}' END)
                      `;
            const query = sql.concat(sort);
            console.log('query - ', query);

            conn.query(query, [], (err, rows) => {
                if (err) {
                    throw new Error(err);
                } else {
                    res.json(rows);
                }
            });
        }else{
            return res.json({"code": '000', "desc": "auth failure", "info": null});
        }
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});


router.get('/Paymnts_Info', async (req, res, next) => {
     try {
        let {
            idx
        } = req.query;

        const sql = ` SELECT
                            M.id,
                            M.jungsan_date,
                            M.total_paymnt_amnt,
                            M.paymnt_method,
                            M.jungsan_amount,
                            M.minus_amount,
                            M.memo, 
                            N.comp_cd,
                            N.comp_nm,
                            N.comp_tel,
                            N.use,
                            M.freeGbn
                       FROM paymnts M
                        LEFT OUTER JOIN comp N
                          ON M.comp_cd = N.comp_cd
                       WHERE M.id = ? 
                      `;

    //     conn.query(sql, [idx], (err, rows) => {
    //         if (err) {
    //             throw new Error(err);
    //         } else {
    //             res.json(rows);
    //         }
    //     });

         const result = await pool.query(sql,
             [idx],
         );

         const sql2 = `
                       SELECT
                              idx,
                              id,
                              cnt,
                              amount
                       FROM amount_his
                       WHERE id = ? 
                       ORDER BY idx ASC 
                       `
         const result2 = await pool.query(sql2,
             [idx],
         );

         const sql3 = `
                         SELECT
                             idx,
                             id,
                             origFileNm,
                             imgFileNm,
                             filePathNm,
                             memo                           
                         FROM imgfile_his
                         WHERE id = ?
                         ORDER BY idx ASC
                       `
         const result3 = await pool.query(sql3,
             [idx],
         );

         res.json({info:result[0], his:result2, file:result3 });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});


router.post('/uploadInfoSave', async (req, res, next) => {

        let compId = req.body.id;
        let dataArr = req.body.list;

        console.log('compId ->>>>>>>>>>>>> ',compId);
        console.log('dataArr ->>>>>>>>>>>>> ',dataArr);

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let sql_multi = '';
            const sql = `
                       DELETE
                       FROM imgfile_his
                       WHERE id = ?
                     `;
            await connection.query(sql, [compId]);

            let sql2 = `
                         INSERT INTO imgfile_his (
                             id,
                             origFileNm,
                             imgFileNm,
                             filePathNm,
                             memo
                         )
                         VALUES
                       `;

            Array.prototype.slice.call(dataArr).forEach( (item, idx) => {
                if(item.id !== ''){
                    if(idx === dataArr.length-1 || dataArr.length === 1){
                        sql_multi += `( ${item.id},'${item.origFileNm}','${item.imgFileNm}','${item.filePathNm}','${item.memo}');`;
                    } else {
                        sql_multi += `( ${item.id},'${item.origFileNm}','${item.imgFileNm}','${item.filePathNm}','${item.memo}'),`;
                    }
                }
            })
            sql2 += sql_multi;
            console.log('sql2 - ', sql2);

            await connection.query(sql2, []);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        res.json({ "code": 200, "desc": "success"});

});


router.get('/paymnts_totalCnt', (req, res, next) => {
    try {
        const sql = `  SELECT
                            COUNT(*) cnt
                       FROM paymnts
                      `;
        const query = sql;
        console.log('query - ', query);

        conn.query(query, [], (err, rows) => {
            if (err) {
                throw new Error(err);
            } else {
                console.log('rows -> ',rows);
                res.json(rows);
            }
        });
    } catch (e) {
        console.error(e);
        next(e);
    }
});


router.post('/paymntsDataUpdate', async (req, res, next) => {
    let id = req.body.id;
    let jungsan_date = req.body.jungsan_date;
    let total_paymnt_amnt = req.body.total_paymnt_amnt;
    let minus_amount = req.body.minus_amount;
    let jungsan_amount = req.body.jungsan_amount;
    let paymnt_method = req.body.paymnt_method;
    let use = req.body.use;

    try {
        await conn.beginTransaction();

        const sql1 = `
                        UPDATE paymnts
                        SET 
                          jungsan_date = ?,
                          total_paymnt_amnt = ?,
                          paymnt_method = ?,
                          minus_amount = ?,
                          jungsan_amount = ?
                        WHERE id = ?        
                   `;
        const upt1 = await conn.query(sql1, [jungsan_date, total_paymnt_amnt, paymnt_method, minus_amount, jungsan_amount, id]);

        const sql2 = `
                        UPDATE paymnts P 
                          INNER JOIN comp C
                            ON P.comp_cd = C.comp_cd
                          SET C.use = ?
                        WHERE P.id = ?   
                   `;
        const upt2 = await conn.query(sql2, [use, id]);

        await conn.commit();
        res.json({ "code": 200, "desc": "success" });
    }
    catch (e) {
        console.log(e)
        await conn.rollback()
        return res.status(500).json(e)
    }
});


router.post('/paymntsDataDelete', async (req, res, next) => {
    let id = req.body.id;

    try {
        await conn.beginTransaction();

        const sql1 = `
                        DELETE FROM paymnts
                        WHERE id = ?        
                   `;
        const del = await conn.query(sql1, [id]);

        await conn.commit();
        res.json({ "code": 200, "desc": "success" });
    }
    catch (e) {
        console.log(e)
        await conn.rollback()
        return res.status(500).json(e)
    }
});


router.post('/paymntsDataMultiDelete', async (req, res, next) => {
    let dataArr = req.body.dataArr;

    try {
        await conn.beginTransaction();

        // let sql_delete = `DELETE FROM tbl_data_grant WHERE pdbase_idx=? AND cno = ? AND mbr_id IN (
        // ${deleteArray
        //     .map((data) => {
        //         return `'${data}'`;
        //     })
        //     .join(",")}
        // )`;

        const sql1 = `
                        DELETE FROM paymnts
                        WHERE id IN (
                            ${
                                dataArr.map((item, index) => {
                                    return `'${item.id}'`;
                                })
                                .join(",")
                            }        
                        )        
                   `;
        const del = await conn.query(sql1, []);

        await conn.commit();
        res.json({ "code": 200, "desc": "success" });
    }
    catch (e) {
        console.log(e)
        await conn.rollback()
        return res.status(500).json(e)
    }
});


const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/png") {
                done(null, 'upload/image');
            } else {
                done(null, 'upload/file');
            }
        },
        filename(req, file, done) {
            console.log('req - >>>>>> ', req);
            console.log('file - >>>>>> ', file);
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            done(null, basename + new Date().valueOf() + ext);
        }
    }),
    limits: { files: 5, fileSize: 20 * 2024 * 2024 },
});


router.post('/fileUpload', upload.array("imageFile[]", 5), (req, res) => {
    console.log('req.file - >>>>>> ', req.file);
    console.log('req.files - >>>>>> ', req.files);
    res.json(req.files);
});


router.post('/paymntHisSave', async (req, res, next) => {
    let compId = req.body.compId;
    let dataArr = req.body.paymntHis;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        let sql_multi = '';
        const sql = `
                       DELETE
                       FROM amount_his
                       WHERE id = ?
                     `;
        await connection.query(sql, [compId]);

        let sql2 = `
                         INSERT INTO amount_his (
                            id,
                            cnt,
                            amount
                         )
                         VALUES
                       `;

        Array.prototype.slice.call(dataArr).forEach( (item, idx) => {
            if(item.id !== ''){
                if(idx === dataArr.length-1 || dataArr.length === 1){
                    sql_multi += `( ${item.id},'${item.cnt}','${item.amount}');`;
                } else {
                    sql_multi += `( ${item.id},'${item.cnt}','${item.amount}'),`;
                }
            }
        })
        sql2 += sql_multi;
        console.log('sql2 - ', sql2);

        await connection.query(sql2, []);
        await connection.commit();
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
    res.json({ "code": 200, "desc": "success"});

});


router.post('/paymntMainSave', async (req, res, next) => {
    let {
        idx,
        comp_nm,
        jungsan_date,
        total_paymnt_amnt,
        minus_amount,
        jungsan_amount,
        paymnt_method,
        use,
        freeGbn
    } = req.body.data;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        let sql_multi = '';
        const sql = `
                    UPDATE paymnts
                    SET jungsan_date = ?,
                        total_paymnt_amnt = ?,
                        paymnt_method = ?,
                        minus_amount = ?,
                        jungsan_amount = ?,
                        freeGbn = ?
                    WHERE id = ?
                     `;
        await connection.query(sql, [jungsan_date, total_paymnt_amnt, paymnt_method, minus_amount, jungsan_amount, freeGbn, idx]);

        let sql2 = `
                        UPDATE paymnts P 
                          INNER JOIN comp C
                            ON P.comp_cd = C.comp_cd
                          SET C.use = ?
                        WHERE P.id = ?  
                       `;
        await connection.query(sql2, [use, idx]);
        await connection.commit();
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
    res.json({ "code": 200, "desc": "success"});
});


router.post('/signup', async (req, res, next) => {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let role = req.body.role;
    let cnt = 0;

    const sql = `  SELECT
                        COUNT(*) cnt
                   FROM user
                   WHERE email = ? `;
    console.log('sql - ', sql);

    await new Promise(async (res, rej) => {
        await conn.query(sql, [email], (err, rows) => {
            if (err) rej(err);
            else res(rows[0].cnt);
        });
    }).then( async (res) => {
        cnt = res;
    }).catch(e => {
        throw new Error(e);
    })

    console.log('cnt ->>>>> ', cnt);
    if (Number(cnt) > 0) {
        return res.json({ "code": 100, "desc": "이메일중복에러", "info": {"username": null, "email": null }});
    }
    else{
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            let sql2 = `
                 INSERT INTO user (
                    username,
                    email,
                    password,
                    role
                 )
                 VALUES (?, ?, ?, ?)
               `;
            const hashedPassword = await bcrypt.hash(password, 12); // salt는 10~13 사이로
            await connection.query(sql2, [username, email, hashedPassword]);
            await connection.commit();
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
        return res.json({ "code": 200, "desc": "success", "info": {"username": username, "email": email }});
    }
});


router.post('/login', async (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;
    let db_username = '';
    let db_email = '';
    let db_password = '';
    let db_role = '';

    const sql = `  SELECT
                        username, email, password, role
                   FROM user
                   WHERE username = ? `;

    await new Promise(async (res, rej) => {
        await conn.query(sql, [username], (err, rows) => {
            if (err) rej(err);
            else res({username: rows[0].username, email: rows[0].email, password: rows[0].password, role: rows[0].role});
        });
    }
    ).then( async (res) => {
        db_username = res.username;
        db_email = res.email;
        db_password = res.password;
        db_role = res.role;
    }
    ).catch(e => {
        throw new Error(e);
    })

    if (db_username === '' || !db_username) {
        return res.json({"code": '000', "desc": "failure", "info": null});
    }
    else{
        try {
            let payload = {db_email};
            let isPasswordMatch = await bcrypt.compare(password, db_password);
            if (isPasswordMatch) {
                payload  = {
                    username: username
                }
            }
            const token = jwt.sign(
                payload,
                process.env.COMM_PASSWD,
            );
            return res.json({"code": 200, "desc": "success", "info": {username: username, email: db_email, token: token, roles: db_role}});
        }
        catch (err) {
            //throw err;
            return res.json({"code": '000', "desc": "failure", "info": null});
        }
    }
});
















module.exports = router;


// UPDATE support_table A
//   INNER JOIN member_table B
//     ON A.sp_uid=B.user_id
//   SET B.level=7
// WHERE B.level=9 AND A.support_money > 10000



// var express = require('express')
// var router = express.Router()
// const pool = require('../database/pool')
//
// router.post('/:boardId/comment', async (req, res, next) => {
//     const { boardId } = req.params
//     const { content } = req.body
//
//     const conn = await pool.getConnection()
//     try {
//         await conn.beginTransaction() // 트랜잭션 적용 시작
//
//         const ins = await conn.query('insert into board_comment set ?', { board_id: boardId, content: content })
//         const upd = await conn.query('update board set comment_cnt = comment_cnt + 1 where board_id = ?', [boardId])
//
//         await conn.commit() // 커밋
//         return res.json(ins)
//     } catch (err) {
//         console.log(err)
//         await conn.rollback() // 롤백
//         return res.status(500).json(err)
//     } finally {
//         conn.release() // conn 회수
//     }
// )
