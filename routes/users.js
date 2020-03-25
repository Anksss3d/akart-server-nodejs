var express = require('express');
var router = express.Router();
const mysql = require('mysql');
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({extended: false}));

function getConnection(){
  return mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ecommerce'
  });
}

function getReturnData(data){
  const dataObj = data.map(row => {
    return {
      user_id: row.user_id,
      user_first_name: row.user_first_name,
      user_last_name: row.user_last_name,
      user_email: row.user_email,
    }
  });
  return dataObj;
}

/* GET products listing. */
router.get('/', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from users", (err, rows, fields) => {
    res.json(getReturnData(rows));
  });
});


/* GET products listing for given id. */
router.get('/:id', function(req, res, next) {
  connection = getConnection();
  connection.query("select * from users where user_id = ?", [req.params.id], (err, rows, fields) => {
    rows = getReturnData(rows);
    if (rows.length == 0){
      res.json(null);
    }
    else {
      res.json(rows[0]);
    }
  });
});


/* POST products listing. */
router.post('/', function(req, res, next) {
  connection = getConnection();
  queryString = "insert into users VALUES(user_id, ?, ?, ?, ?)";
  queryData = [req.body.user_first_name, req.body.user_last_name, req.body.user_email, req.body.user_password];
  connection.query(queryString, queryData, (err, rows, fields) => {
    if (err){
      response = {
        response_code: 1,
        response_message: err
      }
    }
    else{
      response = {
        response_code: 0,
        user_id: rows.insertId
      }
    }
    res.json(response);
  });
});

/* Update User Information */
router.put('/:id', function(req, res, next) {
  connection = getConnection();
  if(!req.body.user_first_name || !req.body.user_last_name || !req.body.user_email){
    response = {
      response_code: 1,
      response_message: "Please Send all Data"
    }
    res.json(response);
  }
  else{
    queryString = "update users set user_first_name = ?, user_last_name=?, user_email=? WHERE user_id=?";
    queryData = [req.body.user_first_name, req.body.user_last_name, req.body.user_email, req.body.user_password, req.params.id];
    connection.query(queryString, queryData, (err, rows, fields) => {
      if (err){
        response = {
          response_code: 1,
          response_message: err
        }
      }
      else{
        response = {
          response_code: 0,
        }
      }
      res.json(response);
    });
  }
});


/* Update User Password */
router.put('/password/:id', function(req, res, next) {
  connection = getConnection();
  if(!req.body.user_password){
    response = {
      response_code: 1,
      response_message: "Please Send Password"
    }
    res.json(response);
  }
  else{
    queryString = "update users set user_password = ? WHERE user_id=?";
    queryData = [req.body.user_password, req.params.id];
    connection.query(queryString, queryData, (err, rows, fields) => {
      if (err){
        response = {
          response_code: 1,
          response_message: err
        }
      }
      else{
        response = {
          response_code: 0,
        }
      }
      res.json(response);
    });
  }
});


/* Delete User */
router.delete('/:id', function(req, res, next) {
  connection = getConnection();
  queryString = "delete from users WHERE user_id=?";
  queryData = [req.params.id];
  connection.query(queryString, queryData, (err, rows, fields) => {
    if (err){
      response = {
        response_code: 1,
        response_message: err
      }
    }
    else{
      response = {
        response_code: 0,
      }
    }
    res.json(response);
  });
});

/* Check User Login */
router.post('/check_login', function(req, res, next) {
  connection = getConnection();

  queryString = "select * from users WHERE user_email=? and user_password=?";
  queryData = [req.body.user_email, req.body.user_password];
  console.log("params are: "+queryData);
  connection.query(queryString, queryData, (err, rows, fields) => {
    if (err){
      response = {
        response_code: 1,
        response_message: err
      }
    }
    else{
      rows = getReturnData(rows);
      if (rows.length == 0){
        response = {
          response_code: 1,
          response_message: "Email ID and Password Doesnt match"
        }
      }
      else{
        response = {
          response_code: 0,
          user:rows[0]
        }
      }
    }
    res.json(response);
  });
});


module.exports = router;
